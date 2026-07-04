import { Hono } from "hono";
import type { AuthVariables } from "../../../../shared/auth-middleware";
import { authMiddleware } from "../../../../shared/auth-middleware";
import { createDb } from "../../../../shared/db";
import type { Bindings } from "../../../../shared/env";
import { DrizzleUserRepository } from "../persistence/drizzle-user-repository";

export const userRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

userRoutes.use("*", authMiddleware);

userRoutes.get("/me", async (c) => {
  const userId = c.get("userId");
  const userRepository = new DrizzleUserRepository(createDb(c.env.DB));

  const user = await userRepository.findById(userId);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ id: user.id, email: user.email, name: user.name, familyId: user.familyId });
});
