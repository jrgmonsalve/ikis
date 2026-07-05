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
  const checking = await accountRepository.create({ familyId: family.id, name: "Checking", type: "checking" });
  const savings = await accountRepository.create({ familyId: family.id, name: "Savings", type: "savings" });

  return { authHeader: `Bearer ${token}`, checkingId: checking.id, savingsId: savings.id };
};

describe("transfer routes", () => {
  it("creates, lists, updates and deletes a transfer end to end", async () => {
    const app = createApp();
    const { authHeader, checkingId, savingsId } = await setup();

    const createResponse = await app.request(
      "/api/v1/transfers",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({
          fromAccountId: checkingId,
          toAccountId: savingsId,
          amount: 20000,
          occurredAt: "2026-07-05",
        }),
      },
      env,
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{
      transfer: { id: string };
      fromAccount: { balance: number };
      toAccount: { balance: number };
    }>();
    expect(created.fromAccount.balance).toBe(-20000);
    expect(created.toAccount.balance).toBe(20000);

    const listResponse = await app.request("/api/v1/transfers", { headers: { Authorization: authHeader } }, env);
    expect(listResponse.status).toBe(200);
    const transfers = await listResponse.json<Array<{ id: string }>>();
    expect(transfers.some((t) => t.id === created.transfer.id)).toBe(true);

    const updateResponse = await app.request(
      `/api/v1/transfers/${created.transfer.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ amount: 15000 }),
      },
      env,
    );
    expect(updateResponse.status).toBe(200);

    const deleteResponse = await app.request(
      `/api/v1/transfers/${created.transfer.id}`,
      { method: "DELETE", headers: { Authorization: authHeader } },
      env,
    );
    expect(deleteResponse.status).toBe(200);
    const deleted = await deleteResponse.json<{ fromAccount: { balance: number }; toAccount: { balance: number } }>();
    expect(deleted.fromAccount.balance).toBe(0);
    expect(deleted.toAccount.balance).toBe(0);
  });

  it("rejects transferring an account to itself", async () => {
    const app = createApp();
    const { authHeader, checkingId } = await setup();

    const response = await app.request(
      "/api/v1/transfers",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({
          fromAccountId: checkingId,
          toAccountId: checkingId,
          amount: 1000,
          occurredAt: "2026-07-05",
        }),
      },
      env,
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when updating a transfer that doesn't exist", async () => {
    const app = createApp();
    const { authHeader } = await setup();

    const response = await app.request(
      `/api/v1/transfers/${crypto.randomUUID()}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ amount: 5000 }),
      },
      env,
    );

    expect(response.status).toBe(404);
  });
});
