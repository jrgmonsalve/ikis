import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { DrizzleAccountRepository } from "../../../../src/modules/accounts/infrastructure/persistence/drizzle-account-repository";
import { DrizzleCommitmentRepository } from "../../../../src/modules/commitments/infrastructure/persistence/drizzle-commitment-repository";
import { DrizzleTransactionRepository } from "../../../../src/modules/transactions/infrastructure/persistence/drizzle-transaction-repository";
import { DrizzleUserRepository } from "../../../../src/modules/users/infrastructure/persistence/drizzle-user-repository";
import { createDb } from "../../../../src/shared/db";

const setup = async () => {
  const db = createDb(env.DB);
  const accountRepository = new DrizzleAccountRepository(db);
  const userRepository = new DrizzleUserRepository(db);
  const commitmentRepository = new DrizzleCommitmentRepository(db);
  const transactionRepository = new DrizzleTransactionRepository(db);

  const familyId = crypto.randomUUID();
  const account = await accountRepository.create({ familyId, name: "Checking", type: "checking" });
  const user = await userRepository.create({ googleId: crypto.randomUUID(), email: `${crypto.randomUUID()}@example.com`, name: "Test" });

  return { commitmentRepository, accountRepository, transactionRepository, familyId, account, userId: user.id };
};

describe("DrizzleCommitmentRepository", () => {
  it("creates a commitment and finds it by id", async () => {
    const { commitmentRepository, familyId, account } = await setup();

    const commitment = await commitmentRepository.create({ familyId, name: "Arriendo", amountLimit: 800000, dueDay: 5, accountId: account.id });

    expect(await commitmentRepository.findById(familyId, commitment.id)).toEqual(commitment);
    expect(commitment.notifyDaysBefore).toBe(3);
    expect(commitment.categoryId).toBeNull();
  });

  it("lists all commitments for a family", async () => {
    const { commitmentRepository, familyId, account } = await setup();
    await commitmentRepository.create({ familyId, name: "Arriendo", amountLimit: 800000, dueDay: 5, accountId: account.id });
    await commitmentRepository.create({ familyId, name: "Gimnasio", amountLimit: 60000, dueDay: 10, accountId: account.id });
    await commitmentRepository.create({ familyId: crypto.randomUUID(), name: "Otra familia", amountLimit: 1, dueDay: 1, accountId: account.id });

    expect(await commitmentRepository.findAllByFamily(familyId)).toHaveLength(2);
  });

  it("updates a commitment", async () => {
    const { commitmentRepository, familyId, account } = await setup();
    const commitment = await commitmentRepository.create({ familyId, name: "Arriendo", amountLimit: 800000, dueDay: 5, accountId: account.id });

    const updated = await commitmentRepository.update(familyId, commitment.id, { amountLimit: 850000, archivedAt: new Date() });

    expect(updated.amountLimit).toBe(850000);
    expect(updated.archivedAt).not.toBeNull();
  });

  it("marks a period as paid linked to a transaction, finds it, and unmarks it", async () => {
    const { commitmentRepository, transactionRepository, familyId, account, userId } = await setup();
    const commitment = await commitmentRepository.create({ familyId, name: "Arriendo", amountLimit: 800000, dueDay: 5, accountId: account.id });
    const { transaction } = await transactionRepository.create({
      familyId,
      accountId: account.id,
      categoryId: null,
      createdByUserId: userId,
      amount: -800000,
      description: "Arriendo",
      occurredAt: "2026-09-05",
    });

    expect(await commitmentRepository.findPayment(familyId, commitment.id, "2026-09")).toBeNull();

    const payment = await commitmentRepository.markPaid(familyId, commitment.id, "2026-09", transaction.id);
    expect(payment.transactionId).toBe(transaction.id);
    expect(await commitmentRepository.findPayment(familyId, commitment.id, "2026-09")).not.toBeNull();

    await commitmentRepository.unmarkPaid(familyId, commitment.id, "2026-09");
    expect(await commitmentRepository.findPayment(familyId, commitment.id, "2026-09")).toBeNull();
  });

  it("rejects a duplicate payment for the same family, commitment and period", async () => {
    const { commitmentRepository, transactionRepository, familyId, account, userId } = await setup();
    const commitment = await commitmentRepository.create({ familyId, name: "Arriendo", amountLimit: 800000, dueDay: 5, accountId: account.id });
    const { transaction } = await transactionRepository.create({
      familyId,
      accountId: account.id,
      categoryId: null,
      createdByUserId: userId,
      amount: -800000,
      description: "Arriendo",
      occurredAt: "2026-09-05",
    });

    await commitmentRepository.markPaid(familyId, commitment.id, "2026-09", transaction.id);

    await expect(commitmentRepository.markPaid(familyId, commitment.id, "2026-09", transaction.id)).rejects.toThrow();
  });

  it("deletes payments when the commitment is deleted (cascade)", async () => {
    const { commitmentRepository, transactionRepository, familyId, account, userId } = await setup();
    const db = createDb(env.DB);
    const commitment = await commitmentRepository.create({ familyId, name: "Arriendo", amountLimit: 800000, dueDay: 5, accountId: account.id });
    const { transaction } = await transactionRepository.create({
      familyId,
      accountId: account.id,
      categoryId: null,
      createdByUserId: userId,
      amount: -800000,
      description: "Arriendo",
      occurredAt: "2026-09-05",
    });
    await commitmentRepository.markPaid(familyId, commitment.id, "2026-09", transaction.id);

    const { commitments } = await import("../../../../src/modules/commitments/infrastructure/persistence/commitments.schema");
    const { eq } = await import("drizzle-orm");
    await db.delete(commitments).where(eq(commitments.id, commitment.id));

    expect(await commitmentRepository.findPayment(familyId, commitment.id, "2026-09")).toBeNull();
  });

  it("deletes commitments when the linked account is deleted (cascade)", async () => {
    const { commitmentRepository, familyId, account } = await setup();
    const db = createDb(env.DB);
    const commitment = await commitmentRepository.create({ familyId, name: "Arriendo", amountLimit: 800000, dueDay: 5, accountId: account.id });

    const { accounts } = await import("../../../../src/modules/accounts/infrastructure/persistence/accounts.schema");
    const { eq } = await import("drizzle-orm");
    await db.delete(accounts).where(eq(accounts.id, account.id));

    expect(await commitmentRepository.findById(familyId, commitment.id)).toBeNull();
  });
});
