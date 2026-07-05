import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { DrizzleAccountRepository } from "../../../../src/modules/accounts/infrastructure/persistence/drizzle-account-repository";
import { DrizzleBudgetRepository } from "../../../../src/modules/budgets/infrastructure/persistence/drizzle-budget-repository";
import { DrizzleCategoryRepository } from "../../../../src/modules/categories/infrastructure/persistence/drizzle-category-repository";
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
    budgetRepository: new DrizzleBudgetRepository(db),
    categoryRepository: new DrizzleCategoryRepository(db),
    accountRepository: new DrizzleAccountRepository(db),
    transactionRepository: new DrizzleTransactionRepository(db),
    userId: user.id,
  };
};

describe("DrizzleBudgetRepository", () => {
  it("creates a budget and enforces the family/category/period unique constraint", async () => {
    const { budgetRepository, categoryRepository } = await setup();
    const familyId = crypto.randomUUID();
    const category = await categoryRepository.create({ familyId, parentId: null, name: "food" });

    const budget = await budgetRepository.create({
      familyId,
      categoryId: category.id,
      period: "2026-07-01",
      amountLimit: 200000,
    });

    expect(budget.amountLimit).toBe(200000);
    expect(await budgetRepository.findByFamilyCategoryAndPeriod(familyId, category.id, "2026-07-01")).toEqual(budget);
  });

  it("derives spent purely from transactions: creations, edits and deletions all reflect without touching the budget", async () => {
    const { budgetRepository, categoryRepository, accountRepository, transactionRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const category = await categoryRepository.create({ familyId, parentId: null, name: "food" });
    const account = await accountRepository.create({ familyId, name: "Checking", type: "checking" });
    const budget = await budgetRepository.create({
      familyId,
      categoryId: category.id,
      period: "2026-07-01",
      amountLimit: 200000,
    });

    const initialStatus = await budgetRepository.getStatusForPeriod(familyId, "2026-07-01");
    expect(initialStatus).toEqual([{ id: budget.id, categoryId: category.id, amountLimit: 200000, spent: 0 }]);

    const { transaction } = await transactionRepository.create({
      familyId,
      accountId: account.id,
      categoryId: category.id,
      createdByUserId: userId,
      amount: -15000,
      description: "Groceries",
      occurredAt: "2026-07-10",
    });

    const afterCreate = await budgetRepository.getStatusForPeriod(familyId, "2026-07-01");
    expect(afterCreate[0]?.spent).toBe(15000);

    await transactionRepository.update(familyId, transaction.id, transaction, { amount: -40000 });

    const afterEdit = await budgetRepository.getStatusForPeriod(familyId, "2026-07-01");
    expect(afterEdit[0]?.spent).toBe(40000);

    await transactionRepository.delete(familyId, transaction.id, { ...transaction, amount: -40000 });

    const afterDelete = await budgetRepository.getStatusForPeriod(familyId, "2026-07-01");
    expect(afterDelete[0]?.spent).toBe(0);
  });

  it("excludes transactions outside the period and income transactions", async () => {
    const { budgetRepository, categoryRepository, accountRepository, transactionRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const category = await categoryRepository.create({ familyId, parentId: null, name: "food" });
    const account = await accountRepository.create({ familyId, name: "Checking", type: "checking" });
    const budget = await budgetRepository.create({
      familyId,
      categoryId: category.id,
      period: "2026-07-01",
      amountLimit: 200000,
    });

    await transactionRepository.create({
      familyId,
      accountId: account.id,
      categoryId: category.id,
      createdByUserId: userId,
      amount: -5000,
      description: "Outside period",
      occurredAt: "2026-08-01",
    });
    await transactionRepository.create({
      familyId,
      accountId: account.id,
      categoryId: null,
      createdByUserId: userId,
      amount: 50000,
      description: "Income",
      occurredAt: "2026-07-15",
    });

    const status = await budgetRepository.getStatusForPeriod(familyId, "2026-07-01");
    expect(status).toEqual([{ id: budget.id, categoryId: category.id, amountLimit: 200000, spent: 0 }]);
  });
});
