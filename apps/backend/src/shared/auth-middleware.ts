import type { MiddlewareHandler } from "hono";
import { DrizzleUserRepository } from "../modules/users/infrastructure/persistence/drizzle-user-repository";
import { createDb } from "./db";
import type { Bindings } from "./env";
import { verifyAppJwt } from "./jwt";

export type AuthVariables = {
  userId: string;
  familyId: string | null;
};

export const authMiddleware: MiddlewareHandler<{ Bindings: Bindings; Variables: AuthVariables }> = async (c, next) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = await verifyAppJwt(c.env.JWT_SECRET, token);
    const userRepository = new DrizzleUserRepository(createDb(c.env.DB));
    const user = await userRepository.findById(payload.sub);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("userId", user.id);
    c.set("familyId", user.familyId);
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
};
