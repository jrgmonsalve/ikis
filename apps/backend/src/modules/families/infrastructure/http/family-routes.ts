import { Hono } from "hono";
import { DrizzleCategoryRepository } from "../../../categories/infrastructure/persistence/drizzle-category-repository";
import { DrizzleUserRepository } from "../../../users/infrastructure/persistence/drizzle-user-repository";
import type { AuthVariables } from "../../../../shared/auth-middleware";
import { authMiddleware } from "../../../../shared/auth-middleware";
import type { Bindings } from "../../../../shared/env";
import { createFamilyForUser } from "../../application/create-family-for-user";
import { DrizzleFamilyRepository } from "../persistence/drizzle-family-repository";

export const familyRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

familyRoutes.use("*", authMiddleware);

familyRoutes.post("/", async (c) => {
  const body = await c.req.json<{ name?: string }>();
  if (!body.name) {
    return c.json({ error: "name is required" }, 400);
  }

  const userId = c.get("userId");
  const familyRepository = new DrizzleFamilyRepository(c.env.DB);
  const userRepository = new DrizzleUserRepository(c.env.DB);
  const categoryRepository = new DrizzleCategoryRepository(c.env.DB);

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
