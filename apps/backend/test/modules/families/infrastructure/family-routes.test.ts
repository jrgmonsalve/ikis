import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createDb } from "../../../../src/shared/db";
import { createApp } from "../../../../src/app";
import { DrizzleUserRepository } from "../../../../src/modules/users/infrastructure/persistence/drizzle-user-repository";
import { signAppJwt } from "../../../../src/shared/jwt";

const authHeaderFor = async (userId: string) => `Bearer ${await signAppJwt(env.JWT_SECRET, { sub: userId })}`;

describe("family routes", () => {
  it("creates a family for the authenticated user", async () => {
    const app = createApp();
    const userRepository = new DrizzleUserRepository(createDb(env.DB));
    const user = await userRepository.create({
      googleId: crypto.randomUUID(),
      email: "ana@example.com",
      name: "Ana",
    });

    const response = await app.request(
      "/api/v1/families",
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
    const userRepository = new DrizzleUserRepository(createDb(env.DB));
    const user = await userRepository.create({
      googleId: crypto.randomUUID(),
      email: "ben@example.com",
      name: "Ben",
    });
    const header = await authHeaderFor(user.id);

    await app.request(
      "/api/v1/families",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: header },
        body: JSON.stringify({ name: "First" }),
      },
      env,
    );
    const response = await app.request(
      "/api/v1/families",
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
      "/api/v1/families",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "García" }),
      },
      env,
    );

    expect(response.status).toBe(401);
  });

  it("gets and updates the family's budgetCycleEndDay", async () => {
    const app = createApp();
    const userRepository = new DrizzleUserRepository(createDb(env.DB));
    const user = await userRepository.create({
      googleId: crypto.randomUUID(),
      email: `${crypto.randomUUID()}@example.com`,
      name: "Test",
    });
    const header = await authHeaderFor(user.id);
    await app.request(
      "/api/v1/families",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: header },
        body: JSON.stringify({ name: "García" }),
      },
      env,
    );

    const getResponse = await app.request("/api/v1/families", { headers: { Authorization: header } }, env);
    expect(getResponse.status).toBe(200);
    const family = await getResponse.json<{ budgetCycleEndDay: number }>();
    expect(family.budgetCycleEndDay).toBe(31);

    const patchResponse = await app.request(
      "/api/v1/families",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: header },
        body: JSON.stringify({ budgetCycleEndDay: 27 }),
      },
      env,
    );
    expect(patchResponse.status).toBe(200);
    const updated = await patchResponse.json<{ budgetCycleEndDay: number }>();
    expect(updated.budgetCycleEndDay).toBe(27);
  });

  it("rejects an out-of-range budgetCycleEndDay", async () => {
    const app = createApp();
    const userRepository = new DrizzleUserRepository(createDb(env.DB));
    const user = await userRepository.create({
      googleId: crypto.randomUUID(),
      email: `${crypto.randomUUID()}@example.com`,
      name: "Test",
    });
    const header = await authHeaderFor(user.id);
    await app.request(
      "/api/v1/families",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: header },
        body: JSON.stringify({ name: "García" }),
      },
      env,
    );

    const response = await app.request(
      "/api/v1/families",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: header },
        body: JSON.stringify({ budgetCycleEndDay: 32 }),
      },
      env,
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 getting settings before the user has a family", async () => {
    const app = createApp();
    const userRepository = new DrizzleUserRepository(createDb(env.DB));
    const user = await userRepository.create({
      googleId: crypto.randomUUID(),
      email: `${crypto.randomUUID()}@example.com`,
      name: "Test",
    });

    const response = await app.request(
      "/api/v1/families",
      { headers: { Authorization: await authHeaderFor(user.id) } },
      env,
    );

    expect(response.status).toBe(400);
  });
});
