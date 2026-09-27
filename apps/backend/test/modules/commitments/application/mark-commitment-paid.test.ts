import { describe, expect, it } from "vitest";
import { markCommitmentPaid } from "../../../../src/modules/commitments/application/mark-commitment-paid";
import { unmarkCommitmentPaid } from "../../../../src/modules/commitments/application/unmark-commitment-paid";
import { InMemoryAccountRepository } from "../../accounts/in-memory-account-repository";
import { InMemoryBudgetRepository } from "../../budgets/in-memory-budget-repository";
import { InMemoryCategoryRepository } from "../../categories/in-memory-category-repository";
import { InMemoryFamilyRepository } from "../../families/in-memory-family-repository";
import { InMemoryTransactionRepository } from "../../transactions/in-memory-transaction-repository";
import { InMemoryCommitmentRepository } from "../in-memory-commitment-repository";

const setup = async () => {
  const commitmentRepository = new InMemoryCommitmentRepository();
  const accountRepository = new InMemoryAccountRepository();
  const categoryRepository = new InMemoryCategoryRepository();
  const budgetRepository = new InMemoryBudgetRepository();
  const familyRepository = new InMemoryFamilyRepository();
  const transactionRepository = new InMemoryTransactionRepository(accountRepository);

  familyRepository.families.push({
    id: "family-1",
    name: "F1",
    budgetCycleEndDay: 28,
    definedCycleStart: null,
    definedCycleEnd: null,
    createdAt: new Date(),
  });
  const account = await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
  const commitment = await commitmentRepository.create({
    familyId: "family-1",
    name: "Arriendo",
    amountLimit: 800000,
    dueDay: 5,
    accountId: account.id,
  });

  return { commitmentRepository, accountRepository, categoryRepository, budgetRepository, familyRepository, transactionRepository, account, commitment };
};

describe("markCommitmentPaid", () => {
  it("creates an expense transaction and debits the account", async () => {
    const deps = await setup();

    const payment = await markCommitmentPaid(deps, { familyId: "family-1", userId: "user-1", commitmentId: deps.commitment.id, period: "2026-09" });

    expect(payment.period).toBe("2026-09");
    expect(deps.transactionRepository.transactions).toHaveLength(1);
    const transaction = deps.transactionRepository.transactions[0]!;
    expect(transaction.amount).toBe(-800000);
    expect(transaction.accountId).toBe(deps.account.id);
    expect(transaction.occurredAt).toBe("2026-09-05");
    expect(payment.transactionId).toBe(transaction.id);

    const account = await deps.accountRepository.findById("family-1", deps.account.id);
    expect(account?.balance).toBe(-800000);
  });

  it("is idempotent when called twice for the same period", async () => {
    const deps = await setup();

    await markCommitmentPaid(deps, { familyId: "family-1", userId: "user-1", commitmentId: deps.commitment.id, period: "2026-09" });
    await markCommitmentPaid(deps, { familyId: "family-1", userId: "user-1", commitmentId: deps.commitment.id, period: "2026-09" });

    expect(deps.commitmentRepository.payments).toHaveLength(1);
    expect(deps.transactionRepository.transactions).toHaveLength(1);
  });

  it("throws when the commitment does not exist", async () => {
    const deps = await setup();

    await expect(
      markCommitmentPaid(deps, { familyId: "family-1", userId: "user-1", commitmentId: "ghost", period: "2026-09" }),
    ).rejects.toThrow("Commitment not found");
  });

  it("rejects an invalid period", async () => {
    const deps = await setup();

    await expect(
      markCommitmentPaid(deps, { familyId: "family-1", userId: "user-1", commitmentId: deps.commitment.id, period: "2026-9" }),
    ).rejects.toThrow("period must be in 'YYYY-MM' format");
  });
});

describe("unmarkCommitmentPaid", () => {
  it("removes the payment and reverts the transaction and balance", async () => {
    const deps = await setup();
    await markCommitmentPaid(deps, { familyId: "family-1", userId: "user-1", commitmentId: deps.commitment.id, period: "2026-09" });

    await unmarkCommitmentPaid(deps, { familyId: "family-1", commitmentId: deps.commitment.id, period: "2026-09" });

    expect(await deps.commitmentRepository.findPayment("family-1", deps.commitment.id, "2026-09")).toBeNull();
    const account = await deps.accountRepository.findById("family-1", deps.account.id);
    expect(account?.balance).toBe(0);
    expect(await deps.transactionRepository.findById("family-1", deps.transactionRepository.transactions[0]!.id)).toBeNull();
  });

  it("does nothing when the period was never marked paid", async () => {
    const deps = await setup();

    await expect(
      unmarkCommitmentPaid(deps, { familyId: "family-1", commitmentId: deps.commitment.id, period: "2026-09" }),
    ).resolves.toBeUndefined();
  });

  it("throws when the commitment does not exist", async () => {
    const deps = await setup();

    await expect(
      unmarkCommitmentPaid(deps, { familyId: "family-1", commitmentId: "ghost", period: "2026-09" }),
    ).rejects.toThrow("Commitment not found");
  });
});
