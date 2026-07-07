import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { DrizzleAccountRepository } from "../../../../src/modules/accounts/infrastructure/persistence/drizzle-account-repository";
import { DrizzleTransferRepository } from "../../../../src/modules/transfers/infrastructure/persistence/drizzle-transfer-repository";
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
    transferRepository: new DrizzleTransferRepository(db),
    userId: user.id,
  };
};

describe("DrizzleTransferRepository", () => {
  it("creating a transfer debits the source and credits the destination", async () => {
    const { accountRepository, transferRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const checking = await accountRepository.create({ familyId, name: "Checking", type: "checking" });
    const savings = await accountRepository.create({ familyId, name: "Savings", type: "savings" });

    const { fromAccount, toAccount } = await transferRepository.create({
      familyId,
      fromAccountId: checking.id,
      toAccountId: savings.id,
      createdByUserId: userId,
      amount: 20000,
      description: "Move to savings",
      occurredAt: "2026-07-05",
    });

    expect(fromAccount.balance).toBe(-20000);
    expect(toAccount.balance).toBe(20000);
  });

  it("editing the amount adjusts both balances by the difference", async () => {
    const { accountRepository, transferRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const checking = await accountRepository.create({ familyId, name: "Checking", type: "checking" });
    const savings = await accountRepository.create({ familyId, name: "Savings", type: "savings" });
    const { transfer } = await transferRepository.create({
      familyId,
      fromAccountId: checking.id,
      toAccountId: savings.id,
      createdByUserId: userId,
      amount: 10000,
      description: null,
      occurredAt: "2026-07-05",
    });

    await transferRepository.update(familyId, transfer.id, transfer, { amount: 15000 });

    expect(await accountRepository.findById(familyId, checking.id)).toMatchObject({ balance: -15000 });
    expect(await accountRepository.findById(familyId, savings.id)).toMatchObject({ balance: 15000 });
  });

  it("editing the destination account moves the credit to the new account", async () => {
    const { accountRepository, transferRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const checking = await accountRepository.create({ familyId, name: "Checking", type: "checking" });
    const savings = await accountRepository.create({ familyId, name: "Savings", type: "savings" });
    const cash = await accountRepository.create({ familyId, name: "Cash", type: "cash" });
    const { transfer } = await transferRepository.create({
      familyId,
      fromAccountId: checking.id,
      toAccountId: savings.id,
      createdByUserId: userId,
      amount: 10000,
      description: null,
      occurredAt: "2026-07-05",
    });

    await transferRepository.update(familyId, transfer.id, transfer, { toAccountId: cash.id });

    expect(await accountRepository.findById(familyId, checking.id)).toMatchObject({ balance: -10000 });
    expect(await accountRepository.findById(familyId, savings.id)).toMatchObject({ balance: 0 });
    expect(await accountRepository.findById(familyId, cash.id)).toMatchObject({ balance: 10000 });
  });

  it("soft deleting a transfer reverts both balances and hides it from listings", async () => {
    const { accountRepository, transferRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const checking = await accountRepository.create({ familyId, name: "Checking", type: "checking" });
    const savings = await accountRepository.create({ familyId, name: "Savings", type: "savings" });
    const { transfer } = await transferRepository.create({
      familyId,
      fromAccountId: checking.id,
      toAccountId: savings.id,
      createdByUserId: userId,
      amount: 10000,
      description: null,
      occurredAt: "2026-07-05",
    });

    await transferRepository.delete(familyId, transfer.id, transfer);

    expect(await accountRepository.findById(familyId, checking.id)).toMatchObject({ balance: 0 });
    expect(await accountRepository.findById(familyId, savings.id)).toMatchObject({ balance: 0 });
    expect(await transferRepository.findById(familyId, transfer.id)).toBeNull();
    expect(await transferRepository.findAllByFamily(familyId)).toHaveLength(0);
  });

  it("existsForAccount ignores soft-deleted transfers", async () => {
    const { accountRepository, transferRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const checking = await accountRepository.create({ familyId, name: "Checking", type: "checking" });
    const savings = await accountRepository.create({ familyId, name: "Savings", type: "savings" });
    const { transfer } = await transferRepository.create({
      familyId,
      fromAccountId: checking.id,
      toAccountId: savings.id,
      createdByUserId: userId,
      amount: 10000,
      description: null,
      occurredAt: "2026-07-05",
    });

    expect(await transferRepository.existsForAccount(familyId, checking.id)).toBe(true);
    expect(await transferRepository.existsForAccount(familyId, savings.id)).toBe(true);

    await transferRepository.delete(familyId, transfer.id, transfer);

    expect(await transferRepository.existsForAccount(familyId, checking.id)).toBe(false);
    expect(await transferRepository.existsForAccount(familyId, savings.id)).toBe(false);
  });

  it("purgeDeletedForAccount removes soft-deleted rows so the account can be hard-deleted", async () => {
    const { accountRepository, transferRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const checking = await accountRepository.create({ familyId, name: "Checking", type: "checking" });
    const savings = await accountRepository.create({ familyId, name: "Savings", type: "savings" });
    const { transfer } = await transferRepository.create({
      familyId,
      fromAccountId: checking.id,
      toAccountId: savings.id,
      createdByUserId: userId,
      amount: 10000,
      description: null,
      occurredAt: "2026-07-05",
    });
    await transferRepository.delete(familyId, transfer.id, transfer);

    await transferRepository.purgeDeletedForAccount(familyId, checking.id);

    await expect(accountRepository.delete(familyId, checking.id)).resolves.not.toThrow();
  });

  it("isolates transfers between families", async () => {
    const { accountRepository, transferRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const otherFamilyId = crypto.randomUUID();
    const checking = await accountRepository.create({ familyId, name: "Checking", type: "checking" });
    const savings = await accountRepository.create({ familyId, name: "Savings", type: "savings" });
    const { transfer } = await transferRepository.create({
      familyId,
      fromAccountId: checking.id,
      toAccountId: savings.id,
      createdByUserId: userId,
      amount: 10000,
      description: null,
      occurredAt: "2026-07-05",
    });

    expect(await transferRepository.findById(otherFamilyId, transfer.id)).toBeNull();
    expect(await transferRepository.findAllByFamily(otherFamilyId)).toHaveLength(0);
  });
});
