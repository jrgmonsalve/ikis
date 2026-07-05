import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../../../../src/app";
import { DrizzleCategoryRepository } from "../../../../src/modules/categories/infrastructure/persistence/drizzle-category-repository";
import { DrizzleFamilyRepository } from "../../../../src/modules/families/infrastructure/persistence/drizzle-family-repository";
import { DrizzleUserRepository } from "../../../../src/modules/users/infrastructure/persistence/drizzle-user-repository";
import { createDb } from "../../../../src/shared/db";
import { signAppJwt } from "../../../../src/shared/jwt";

const setup = async () => {
  const db = createDb(env.DB);
  const userRepository = new DrizzleUserRepository(db);
  const familyRepository = new DrizzleFamilyRepository(db);
  const categoryRepository = new DrizzleCategoryRepository(db);

  const user = await userRepository.create({
    googleId: crypto.randomUUID(),
    email: `${crypto.randomUUID()}@example.com`,
    name: "Test",
  });
  const family = await familyRepository.create({ name: "Test Family" });
  await userRepository.assignFamily(user.id, family.id);
  const token = await signAppJwt(env.JWT_SECRET, { sub: user.id });
  const category = await categoryRepository.create({ familyId: family.id, parentId: null, name: "food" });

  return { authHeader: `Bearer ${token}`, categoryId: category.id };
};

describe("budget routes", () => {
  it("creates a budget and reads its status back", async () => {
    const app = createApp();
    const { authHeader, categoryId } = await setup();

    const createResponse = await app.request(
      "/api/v1/budgets",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ categoryId, period: "2026-07", amountLimit: 200000 }),
      },
      env,
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: string; period: string }>();
    expect(created.period).toBe("2026-07-01");

    const statusResponse = await app.request(
      "/api/v1/budgets?period=2026-07",
      { headers: { Authorization: authHeader } },
      env,
    );
    expect(statusResponse.status).toBe(200);
    const status = await statusResponse.json<Array<{ id: string; spent: number }>>();
    expect(status.find((b) => b.id === created.id)?.spent).toBe(0);

    const updateResponse = await app.request(
      `/api/v1/budgets/${created.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ amountLimit: 300000 }),
      },
      env,
    );
    expect(updateResponse.status).toBe(200);
    const updated = await updateResponse.json<{ amountLimit: number }>();
    expect(updated.amountLimit).toBe(300000);
  });

  it("requires a period query param", async () => {
    const app = createApp();
    const { authHeader } = await setup();

    const response = await app.request("/api/v1/budgets", { headers: { Authorization: authHeader } }, env);

    expect(response.status).toBe(400);
  });

  it("rejects a duplicate budget for the same category and period", async () => {
    const app = createApp();
    const { authHeader, categoryId } = await setup();

    await app.request(
      "/api/v1/budgets",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ categoryId, period: "2026-07", amountLimit: 200000 }),
      },
      env,
    );
    const response = await app.request(
      "/api/v1/budgets",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ categoryId, period: "2026-07", amountLimit: 100000 }),
      },
      env,
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when updating a budget that doesn't exist", async () => {
    const app = createApp();
    const { authHeader } = await setup();

    const response = await app.request(
      `/api/v1/budgets/${crypto.randomUUID()}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ amountLimit: 1000 }),
      },
      env,
    );

    expect(response.status).toBe(404);
  });
});
