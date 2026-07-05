import { Hono } from "hono";
import { DrizzleCategoryRepository } from "../../../categories/infrastructure/persistence/drizzle-category-repository";
import { DrizzleUserRepository } from "../../../users/infrastructure/persistence/drizzle-user-repository";
import type { AuthVariables } from "../../../../shared/auth-middleware";
import { authMiddleware } from "../../../../shared/auth-middleware";
import { createDb } from "../../../../shared/db";
import type { Bindings } from "../../../../shared/env";
import { createFamilyForUser } from "../../application/create-family-for-user";
import { updateFamilySettings } from "../../application/update-family-settings";
import { DrizzleFamilyRepository } from "../persistence/drizzle-family-repository";

export const familyRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

familyRoutes.use("*", authMiddleware);

familyRoutes.get("/", async (c) => {
  const familyId = c.get("familyId");
  if (!familyId) {
    return c.json({ error: "User does not belong to a family yet" }, 400);
  }

  const familyRepository = new DrizzleFamilyRepository(createDb(c.env.DB));
  const family = await familyRepository.findById(familyId);
  if (!family) {
    return c.json({ error: "Family not found" }, 404);
  }

  return c.json(family);
});

familyRoutes.patch("/", async (c) => {
  const familyId = c.get("familyId");
  if (!familyId) {
    return c.json({ error: "User does not belong to a family yet" }, 400);
  }

  const body = await c.req.json<{ budgetCycleStartDay?: number }>();
  const familyRepository = new DrizzleFamilyRepository(createDb(c.env.DB));

  try {
    const family = await updateFamilySettings({ familyRepository }, { familyId, changes: body });
    return c.json(family);
  } catch (err) {
    if (err instanceof Error) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

familyRoutes.post("/", async (c) => {
  const body = await c.req.json<{ name?: string }>();
  if (!body.name) {
    return c.json({ error: "name is required" }, 400);
  }

  const userId = c.get("userId");
  const db = createDb(c.env.DB);
  const familyRepository = new DrizzleFamilyRepository(db);
  const userRepository = new DrizzleUserRepository(db);
  const categoryRepository = new DrizzleCategoryRepository(db);

  try {
    const family = await createFamilyForUser(
      { familyRepository, userRepository, categoryRepository },
      { userId, name: body.name },
    );
    return c.json(family, 201);
  } catch (err) {
    if (err instanceof Error && err.message === "User already belongs to a family") {
      return c.json({ error: err.message }, 409);
    }
    throw err;
  }
});
