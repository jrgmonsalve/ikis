import { describe, expect, it } from "vitest";
import { createTransaction } from "../../../../src/modules/transactions/application/create-transaction";
import { updateTransaction } from "../../../../src/modules/transactions/application/update-transaction";
import { InMemoryAccountRepository } from "../../accounts/in-memory-account-repository";
import { InMemoryBudgetRepository } from "../../budgets/in-memory-budget-repository";
import { InMemoryCategoryRepository } from "../../categories/in-memory-category-repository";
import { InMemoryFamilyRepository } from "../../families/in-memory-family-repository";
import { InMemoryTransactionRepository } from "../in-memory-transaction-repository";

const setup = () => {
  const accountRepository = new InMemoryAccountRepository();
  const categoryRepository = new InMemoryCategoryRepository();
  const transactionRepository = new InMemoryTransactionRepository(accountRepository);
  const budgetRepository = new InMemoryBudgetRepository();
  const familyRepository = new InMemoryFamilyRepository();
  return { accountRepository, categoryRepository, transactionRepository, budgetRepository, familyRepository };
};

describe("updateTransaction", () => {
  it("adjusts the account balance by the amount difference", async () => {
    const deps = setup();
    const account = await deps.accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const { transaction } = await createTransaction(deps, {
      familyId: "family-1",
      accountId: account.id,
      categoryId: null,
      createdByUserId: "user-1",
      amount: -1000,
      description: null,
      occurredAt: "2026-07-05",
    });

    const { accounts } = await updateTransaction(deps, {
      familyId: "family-1",
      id: transaction.id,
      changes: { amount: -3000 },
    });

    expect(accounts[0]?.balance).toBe(-3000);
  });

  it("reverts the old account and applies the new one when the account changes", async () => {
    const deps = setup();
    const accountA = await deps.accountRepository.create({ familyId: "family-1", name: "A", type: "checking" });
    const accountB = await deps.accountRepository.create({ familyId: "family-1", name: "B", type: "checking" });
    const { transaction } = await createTransaction(deps, {
      familyId: "family-1",
      accountId: accountA.id,
      categoryId: null,
      createdByUserId: "user-1",
      amount: -1000,
      description: null,
      occurredAt: "2026-07-05",
    });

    await updateTransaction(deps, { familyId: "family-1", id: transaction.id, changes: { accountId: accountB.id } });

    expect(accountA.balance).toBe(0);
    expect(accountB.balance).toBe(-1000);
  });

  it("rejects turning a transaction into an income while keeping a category", async () => {
    const deps = setup();
    const account = await deps.accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const category = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    const { transaction } = await createTransaction(deps, {
      familyId: "family-1",
      accountId: account.id,
      categoryId: category.id,
      createdByUserId: "user-1",
      amount: -1000,
      description: null,
      occurredAt: "2026-07-05",
    });

    await expect(
      updateTransaction(deps, { familyId: "family-1", id: transaction.id, changes: { amount: 1000 } }),
    ).rejects.toThrow("Income transactions cannot have a category");
  });

  it("rejects updating a transaction from another family", async () => {
    const deps = setup();
    const account = await deps.accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const { transaction } = await createTransaction(deps, {
      familyId: "family-1",
      accountId: account.id,
      categoryId: null,
      createdByUserId: "user-1",
      amount: -1000,
      description: null,
      occurredAt: "2026-07-05",
    });

    await expect(
      updateTransaction(deps, { familyId: "family-2", id: transaction.id, changes: { amount: -2000 } }),
    ).rejects.toThrow("Transaction not found");
  });

  it("rejects raising the amount past the category's remaining budget", async () => {
    const deps = setup();
    deps.familyRepository.families.push({
      id: "family-1",
      name: "F1",
      budgetCycleEndDay: 31,
      definedCycleStart: null,
      definedCycleEnd: null,
      createdAt: new Date(),
    });
    // Mirrors the real Drizzle repository: `spent` is read back from persisted transactions,
    // so this fixture is updated below once the transaction under test actually exists.
    const spentTransactions: { familyId: string; categoryId: string | null; amount: number; occurredAt: string; deletedAt: Date | null }[] = [];
    deps.budgetRepository = new InMemoryBudgetRepository(spentTransactions);
    const account = await deps.accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const category = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: category.id,
      period: "2026-07-01",
      periodEnd: "2026-07-31",
      amountLimit: 10000,
    });
    const { transaction } = await createTransaction(deps, {
      familyId: "family-1",
      accountId: account.id,
      categoryId: category.id,
      createdByUserId: "user-1",
      amount: -5000,
      description: null,
      occurredAt: "2026-07-05",
    });
    spentTransactions.push({ familyId: "family-1", categoryId: category.id, amount: -5000, occurredAt: "2026-07-05", deletedAt: null });

    await expect(
      updateTransaction(deps, { familyId: "family-1", id: transaction.id, changes: { amount: -15000 } }),
    ).rejects.toThrow("Expense exceeds the remaining budget for this category (remaining: 10000)");
  });

  it("allows keeping the same amount even when it fills the whole budget", async () => {
    const deps = setup();
    deps.familyRepository.families.push({
      id: "family-1",
      name: "F1",
      budgetCycleEndDay: 31,
      definedCycleStart: null,
      definedCycleEnd: null,
      createdAt: new Date(),
    });
    const spentTransactions: { familyId: string; categoryId: string | null; amount: number; occurredAt: string; deletedAt: Date | null }[] = [];
    deps.budgetRepository = new InMemoryBudgetRepository(spentTransactions);
    const account = await deps.accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const category = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: category.id,
      period: "2026-07-01",
      periodEnd: "2026-07-31",
      amountLimit: 10000,
    });
    const { transaction } = await createTransaction(deps, {
      familyId: "family-1",
      accountId: account.id,
      categoryId: category.id,
      createdByUserId: "user-1",
      amount: -10000,
      description: null,
      occurredAt: "2026-07-05",
    });
    spentTransactions.push({ familyId: "family-1", categoryId: category.id, amount: -10000, occurredAt: "2026-07-05", deletedAt: null });

    const { transaction: updated } = await updateTransaction(deps, {
      familyId: "family-1",
      id: transaction.id,
      changes: { description: "same amount, just a note" },
    });

    expect(updated.amount).toBe(-10000);
  });
});
