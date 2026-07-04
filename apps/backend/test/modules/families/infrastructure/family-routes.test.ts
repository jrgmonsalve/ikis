import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../../../../src/app";
import { DrizzleUserRepository } from "../../../../src/modules/users/infrastructure/persistence/drizzle-user-repository";
import { signAppJwt } from "../../../../src/shared/jwt";

const authHeaderFor = async (userId: string) => `Bearer ${await signAppJwt(env.JWT_SECRET, { sub: userId })}`;

describe("family routes", () => {
  it("creates a family for the authenticated user", async () => {
    const app = createApp();
    const userRepository = new DrizzleUserRepository(env.DB);
    const user = await userRepository.create({
      googleId: crypto.randomUUID(),
      email: "ana@example.com",
      name: "Ana",
    });

    const response = await app.request(
      "/families",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: await authHeaderFor(user.id) },
        body: JSON.stringify({ name: "García" }),
      },
      env,
    );

    expect(response.status).toBe(201);
    const family = await response.json<{ id: string; name: string }>();
    expect(family.name).toBe("García");
  });

  it("rejects when the user already belongs to a family", async () => {
    const app = createApp();
    const userRepository = new DrizzleUserRepository(env.DB);
    const user = await userRepository.create({
      googleId: crypto.randomUUID(),
      email: "ben@example.com",
      name: "Ben",
    });
    const header = await authHeaderFor(user.id);

    await app.request(
      "/families",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: header },
        body: JSON.stringify({ name: "First" }),
      },
      env,
    );
    const response = await app.request(
      "/families",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: header },
        body: JSON.stringify({ name: "Second" }),
      },
      env,
    );

    expect(response.status).toBe(409);
  });

  it("requires authentication", async () => {
    const app = createApp();

    const response = await app.request(
      "/families",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "García" }),
      },
      env,
    );

    expect(response.status).toBe(401);
  });
});
