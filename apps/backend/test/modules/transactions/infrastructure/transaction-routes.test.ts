import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../../../../src/app";
import { DrizzleAccountRepository } from "../../../../src/modules/accounts/infrastructure/persistence/drizzle-account-repository";
import { DrizzleFamilyRepository } from "../../../../src/modules/families/infrastructure/persistence/drizzle-family-repository";
import { DrizzleUserRepository } from "../../../../src/modules/users/infrastructure/persistence/drizzle-user-repository";
import { createDb } from "../../../../src/shared/db";
import { signAppJwt } from "../../../../src/shared/jwt";

const setup = async () => {
  const db = createDb(env.DB);
  const userRepository = new DrizzleUserRepository(db);
  const familyRepository = new DrizzleFamilyRepository(db);
  const accountRepository = new DrizzleAccountRepository(db);

  const user = await userRepository.create({
    googleId: crypto.randomUUID(),
    email: `${crypto.randomUUID()}@example.com`,
    name: "Test",
  });
  const family = await familyRepository.create({ name: "Test Family" });
  await userRepository.assignFamily(user.id, family.id);
  const token = await signAppJwt(env.JWT_SECRET, { sub: user.id });
  const account = await accountRepository.create({ familyId: family.id, name: "Checking", type: "checking" });

  return { authHeader: `Bearer ${token}`, accountId: account.id, familyId: family.id };
};

describe("transaction routes", () => {
  it("creates, lists, updates and deletes a transaction end to end", async () => {
    const app = createApp();
    const { authHeader, accountId } = await setup();

    const createResponse = await app.request(
      "/api/v1/transactions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ accountId, amount: -1500, occurredAt: "2026-07-05", description: "Groceries" }),
      },
      env,
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{
      transaction: { id: string; amount: number };
      account: { balance: number };
    }>();
    expect(created.account.balance).toBe(-1500);

    const listResponse = await app.request(
      "/api/v1/transactions",
      { headers: { Authorization: authHeader } },
      env,
    );
    expect(listResponse.status).toBe(200);
    const transactions = await listResponse.json<Array<{ id: string }>>();
    expect(transactions.some((t) => t.id === created.transaction.id)).toBe(true);

    const updateResponse = await app.request(
      `/api/v1/transactions/${created.transaction.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ amount: -3000 }),
      },
      env,
    );
    expect(updateResponse.status).toBe(200);
    const updated = await updateResponse.json<{ accounts: Array<{ balance: number }> }>();
    expect(updated.accounts[0]?.balance).toBe(-3000);

    const deleteResponse = await app.request(
      `/api/v1/transactions/${created.transaction.id}`,
      { method: "DELETE", headers: { Authorization: authHeader } },
      env,
    );
    expect(deleteResponse.status).toBe(200);
    const deleted = await deleteResponse.json<{ account: { balance: number } }>();
    expect(deleted.account.balance).toBe(0);
  });

  it("rejects a zero amount", async () => {
    const app = createApp();
    const { authHeader, accountId } = await setup();

    const response = await app.request(
      "/api/v1/transactions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ accountId, amount: 0, occurredAt: "2026-07-05" }),
      },
      env,
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when updating a transaction that doesn't exist", async () => {
    const app = createApp();
    const { authHeader } = await setup();

    const response = await app.request(
      `/api/v1/transactions/${crypto.randomUUID()}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ amount: -1000 }),
      },
      env,
    );

    expect(response.status).toBe(404);
  });

  it("requires accountId, amount and occurredAt", async () => {
    const app = createApp();
    const { authHeader } = await setup();

    const response = await app.request(
      "/api/v1/transactions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({}),
      },
      env,
    );

    expect(response.status).toBe(400);
  });
});
