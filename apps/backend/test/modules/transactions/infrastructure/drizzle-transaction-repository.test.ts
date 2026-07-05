import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { DrizzleAccountRepository } from "../../../../src/modules/accounts/infrastructure/persistence/drizzle-account-repository";
import { DrizzleTransactionRepository } from "../../../../src/modules/transactions/infrastructure/persistence/drizzle-transaction-repository";
import { DrizzleUserRepository } from "../../../../src/modules/users/infrastructure/persistence/drizzle-user-repository";
import { createDb } from "../../../../src/shared/db";

const setup = async () => {
  const db = createDb(env.DB);
  const userRepository = new DrizzleUserRepository(db);
  const user = await userRepository.create({
    googleId: crypto.randomUUID(),
    email: `${crypto.randomUUID()}@example.com`,
    name: "Test",
  });

  return {
    accountRepository: new DrizzleAccountRepository(db),
    transactionRepository: new DrizzleTransactionRepository(db),
    userId: user.id,
  };
};

describe("DrizzleTransactionRepository", () => {
  it("creating a transaction updates the account balance", async () => {
    const { accountRepository, transactionRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const account = await accountRepository.create({ familyId, name: "Checking", type: "checking" });

    const { account: updated } = await transactionRepository.create({
      familyId,
      accountId: account.id,
      categoryId: null,
      createdByUserId: userId,
      amount: -1500,
      description: "Groceries",
      occurredAt: "2026-07-05",
    });

    expect(updated.balance).toBe(-1500);
    expect(await accountRepository.findById(familyId, account.id)).toMatchObject({ balance: -1500 });
  });

  it("editing the amount adjusts the balance by the difference", async () => {
    const { accountRepository, transactionRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const account = await accountRepository.create({ familyId, name: "Checking", type: "checking" });
    const { transaction } = await transactionRepository.create({
      familyId,
      accountId: account.id,
      categoryId: null,
      createdByUserId: userId,
      amount: -1000,
      description: null,
      occurredAt: "2026-07-05",
    });

    const { accounts } = await transactionRepository.update(familyId, transaction.id, transaction, {
      amount: -3000,
    });

    expect(accounts[0]?.balance).toBe(-3000);
  });

  it("editing the account moves the balance from the old account to the new one", async () => {
    const { accountRepository, transactionRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const accountA = await accountRepository.create({ familyId, name: "A", type: "checking" });
    const accountB = await accountRepository.create({ familyId, name: "B", type: "checking" });
    const { transaction } = await transactionRepository.create({
      familyId,
      accountId: accountA.id,
      categoryId: null,
      createdByUserId: userId,
      amount: -1000,
      description: null,
      occurredAt: "2026-07-05",
    });

    await transactionRepository.update(familyId, transaction.id, transaction, { accountId: accountB.id });

    expect(await accountRepository.findById(familyId, accountA.id)).toMatchObject({ balance: 0 });
    expect(await accountRepository.findById(familyId, accountB.id)).toMatchObject({ balance: -1000 });
  });

  it("soft deleting a transaction reverts the balance and hides it from listings", async () => {
    const { accountRepository, transactionRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const account = await accountRepository.create({ familyId, name: "Checking", type: "checking" });
    const { transaction } = await transactionRepository.create({
      familyId,
      accountId: account.id,
      categoryId: null,
      createdByUserId: userId,
      amount: -1000,
      description: null,
      occurredAt: "2026-07-05",
    });

    const { account: updated } = await transactionRepository.delete(familyId, transaction.id, transaction);

    expect(updated.balance).toBe(0);
    expect(await transactionRepository.findById(familyId, transaction.id)).toBeNull();
    expect(await transactionRepository.findAllByFamily(familyId)).toHaveLength(0);
  });

  it("isolates transactions between families", async () => {
    const { accountRepository, transactionRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const otherFamilyId = crypto.randomUUID();
    const account = await accountRepository.create({ familyId, name: "Checking", type: "checking" });
    const { transaction } = await transactionRepository.create({
      familyId,
      accountId: account.id,
      categoryId: null,
      createdByUserId: userId,
      amount: -1000,
      description: null,
      occurredAt: "2026-07-05",
    });

    expect(await transactionRepository.findById(otherFamilyId, transaction.id)).toBeNull();
    expect(await transactionRepository.findAllByFamily(otherFamilyId)).toHaveLength(0);
  });
});
