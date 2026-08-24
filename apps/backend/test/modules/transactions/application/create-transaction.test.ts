import { describe, expect, it } from "vitest";
import { createTransaction } from "../../../../src/modules/transactions/application/create-transaction";
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

describe("createTransaction", () => {
  it("creates an expense and debits the account balance", async () => {
    const deps = setup();
    const account = await deps.accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const category = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });

    const { transaction, account: updatedAccount } = await createTransaction(deps, {
      familyId: "family-1",
      accountId: account.id,
      categoryId: category.id,
      createdByUserId: "user-1",
      amount: -5000,
      description: "Groceries",
      occurredAt: "2026-07-05",
    });

    expect(transaction.amount).toBe(-5000);
    expect(updatedAccount.balance).toBe(-5000);
  });

  it("creates an income without a category and credits the account balance", async () => {
    const deps = setup();
    const account = await deps.accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });

    const { account: updatedAccount } = await createTransaction(deps, {
      familyId: "family-1",
      accountId: account.id,
      categoryId: null,
      createdByUserId: "user-1",
      amount: 100000,
      description: "Salary",
      occurredAt: "2026-07-05",
    });

    expect(updatedAccount.balance).toBe(100000);
  });

  it("rejects a zero amount", async () => {
    const deps = setup();
    const account = await deps.accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });

    await expect(
      createTransaction(deps, {
        familyId: "family-1",
        accountId: account.id,
        categoryId: null,
        createdByUserId: "user-1",
        amount: 0,
        description: null,
        occurredAt: "2026-07-05",
      }),
    ).rejects.toThrow("Amount cannot be zero");
  });

  it("rejects an income transaction with a category", async () => {
    const deps = setup();
    const account = await deps.accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const category = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });

    await expect(
      createTransaction(deps, {
        familyId: "family-1",
        accountId: account.id,
        categoryId: category.id,
        createdByUserId: "user-1",
        amount: 1000,
        description: null,
        occurredAt: "2026-07-05",
      }),
    ).rejects.toThrow("Income transactions cannot have a category");
  });

  it("rejects a transaction on an account from another family", async () => {
    const deps = setup();
    const account = await deps.accountRepository.create({ familyId: "family-2", name: "Checking", type: "checking" });

    await expect(
      createTransaction(deps, {
        familyId: "family-1",
        accountId: account.id,
        categoryId: null,
        createdByUserId: "user-1",
        amount: -1000,
        description: null,
        occurredAt: "2026-07-05",
      }),
    ).rejects.toThrow("Account not found");
  });

  it("rejects a transaction with a category from another family", async () => {
    const deps = setup();
    const account = await deps.accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const category = await deps.categoryRepository.create({ familyId: "family-2", parentId: null, name: "food" });

    await expect(
      createTransaction(deps, {
        familyId: "family-1",
        accountId: account.id,
        categoryId: category.id,
        createdByUserId: "user-1",
        amount: -1000,
        description: null,
        occurredAt: "2026-07-05",
      }),
    ).rejects.toThrow("Category not found");
  });

  it("rejects an expense that exceeds the remaining budget of its category", async () => {
    const deps = setup();
    deps.familyRepository.families.push({
      id: "family-1",
      name: "F1",
      budgetCycleEndDay: 31,
      definedCycleStart: null,
      definedCycleEnd: null,
      createdAt: new Date(),
    });
    const account = await deps.accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const category = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: category.id,
      period: "2026-07-01",
      periodEnd: "2026-07-31",
      amountLimit: 10000,
    });

    await expect(
      createTransaction(deps, {
        familyId: "family-1",
        accountId: account.id,
        categoryId: category.id,
        createdByUserId: "user-1",
        amount: -15000,
        description: null,
        occurredAt: "2026-07-05",
      }),
    ).rejects.toThrow("Expense exceeds the remaining budget for this category (remaining: 10000)");
  });
});
