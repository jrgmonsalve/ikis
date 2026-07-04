import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../../../../src/app";
import { DrizzleUserRepository } from "../../../../src/modules/users/infrastructure/persistence/drizzle-user-repository";
import { createDb } from "../../../../src/shared/db";
import { signAppJwt } from "../../../../src/shared/jwt";

describe("GET /me", () => {
  it("returns the authenticated user's profile", async () => {
    const app = createApp();
    const userRepository = new DrizzleUserRepository(createDb(env.DB));
    const user = await userRepository.create({
      googleId: crypto.randomUUID(),
      email: "ana@example.com",
      name: "Ana",
    });
    const token = await signAppJwt(env.JWT_SECRET, { sub: user.id });

    const response = await app.request("/me", { headers: { Authorization: `Bearer ${token}` } }, env);

    expect(response.status).toBe(200);
    const body = await response.json<{ id: string; email: string; name: string; familyId: string | null }>();
    expect(body).toEqual({ id: user.id, email: "ana@example.com", name: "Ana", familyId: null });
  });

  it("reflects the familyId once the user creates a family", async () => {
    const app = createApp();
    const userRepository = new DrizzleUserRepository(createDb(env.DB));
    const user = await userRepository.create({
      googleId: crypto.randomUUID(),
      email: "ben@example.com",
      name: "Ben",
    });
    const token = await signAppJwt(env.JWT_SECRET, { sub: user.id });

    await app.request(
      "/families",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: "Ben Family" }),
      },
      env,
    );

    const response = await app.request("/me", { headers: { Authorization: `Bearer ${token}` } }, env);
    const body = await response.json<{ familyId: string | null }>();

    expect(body.familyId).not.toBeNull();
  });

  it("requires authentication", async () => {
    const app = createApp();

    const response = await app.request("/me", {}, env);

    expect(response.status).toBe(401);
  });
});
