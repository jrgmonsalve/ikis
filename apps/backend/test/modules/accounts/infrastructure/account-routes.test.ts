import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../../../../src/app";
import { DrizzleFamilyRepository } from "../../../../src/modules/families/infrastructure/persistence/drizzle-family-repository";
import { DrizzleUserRepository } from "../../../../src/modules/users/infrastructure/persistence/drizzle-user-repository";
import { createDb } from "../../../../src/shared/db";
import { signAppJwt } from "../../../../src/shared/jwt";

const createAuthenticatedUserWithFamily = async () => {
  const userRepository = new DrizzleUserRepository(createDb(env.DB));
  const familyRepository = new DrizzleFamilyRepository(createDb(env.DB));
  const user = await userRepository.create({
    googleId: crypto.randomUUID(),
    email: `${crypto.randomUUID()}@example.com`,
    name: "Test",
  });
  const family = await familyRepository.create({ name: "Test Family" });
  await userRepository.assignFamily(user.id, family.id);
  const token = await signAppJwt(env.JWT_SECRET, { sub: user.id });

  return { authHeader: `Bearer ${token}` };
};

describe("account routes", () => {
  it("rejects when the user has no family yet", async () => {
    const app = createApp();
    const userRepository = new DrizzleUserRepository(createDb(env.DB));
    const user = await userRepository.create({
      googleId: crypto.randomUUID(),
      email: "no-family@example.com",
      name: "NoFam",
    });
    const token = await signAppJwt(env.JWT_SECRET, { sub: user.id });

    const response = await app.request(
      "/api/v1/accounts",
      { headers: { Authorization: `Bearer ${token}` } },
      env,
    );

    expect(response.status).toBe(400);
  });

  it("creates, lists, and updates an account end to end", async () => {
    const app = createApp();
    const { authHeader } = await createAuthenticatedUserWithFamily();

    const createResponse = await app.request(
      "/api/v1/accounts",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ name: "Checking", type: "checking" }),
      },
      env,
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: string; balance: number; currency: string }>();
    expect(created.balance).toBe(0);
    expect(created.currency).toBe("COP");

    const listResponse = await app.request(
      "/api/v1/accounts",
      { headers: { Authorization: authHeader } },
      env,
    );
    expect(listResponse.status).toBe(200);
    const accounts = await listResponse.json<Array<{ id: string }>>();
    expect(accounts.some((account) => account.id === created.id)).toBe(true);

    const updateResponse = await app.request(
      `/api/v1/accounts/${created.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ name: "Main checking" }),
      },
      env,
    );
    expect(updateResponse.status).toBe(200);
    const updated = await updateResponse.json<{ name: string }>();
    expect(updated.name).toBe("Main checking");
  });

  it("rejects creating an account with an invalid type", async () => {
    const app = createApp();
    const { authHeader } = await createAuthenticatedUserWithFamily();

    const response = await app.request(
      "/api/v1/accounts",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ name: "Checking", type: "bogus" }),
      },
      env,
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when updating an account that doesn't exist", async () => {
    const app = createApp();
    const { authHeader } = await createAuthenticatedUserWithFamily();

    const response = await app.request(
      `/api/v1/accounts/${crypto.randomUUID()}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ name: "Ghost" }),
      },
      env,
    );

    expect(response.status).toBe(404);
  });
});
