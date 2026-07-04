import { Hono } from "hono";
import { createDb } from "../../../../shared/db";
import type { Bindings } from "../../../../shared/env";
import { DrizzleUserRepository } from "../../../users/infrastructure/persistence/drizzle-user-repository";
import { loginAsDevUser } from "../../application/login-as-dev-user";
import { loginWithGoogle } from "../../application/login-with-google";
import { JoseGoogleIdTokenVerifier } from "../google-id-token-verifier";

export const authRoutes = new Hono<{ Bindings: Bindings }>();

authRoutes.post("/google", async (c) => {
  const body = await c.req.json<{ idToken?: string }>();
  if (!body.idToken) {
    return c.json({ error: "idToken is required" }, 400);
  }

  const userRepository = new DrizzleUserRepository(createDb(c.env.DB));
  const googleIdTokenVerifier = new JoseGoogleIdTokenVerifier(c.env.GOOGLE_CLIENT_ID);

  try {
    const token = await loginWithGoogle(
      { googleIdTokenVerifier, userRepository, jwtSecret: c.env.JWT_SECRET },
      body.idToken,
    );
    return c.json({ token });
  } catch {
    return c.json({ error: "Invalid Google ID token" }, 401);
  }
});

authRoutes.post("/dev", async (c) => {
  if (c.env.DEV_AUTH !== "true") {
    return c.json({ error: "Not found" }, 404);
  }

  const userRepository = new DrizzleUserRepository(createDb(c.env.DB));
  const token = await loginAsDevUser({ userRepository, jwtSecret: c.env.JWT_SECRET });

  return c.json({ token });
});
