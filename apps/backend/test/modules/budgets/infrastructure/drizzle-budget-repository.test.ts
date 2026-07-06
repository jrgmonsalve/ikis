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
  it("creates a budget and finds it by any date inside its cycle", async () => {
    const { budgetRepository, categoryRepository } = await setup();
    const familyId = crypto.randomUUID();
    const category = await categoryRepository.create({ familyId, parentId: null, name: "food" });

    const budget = await budgetRepository.create({
      familyId,
      categoryId: category.id,
      period: "2026-06-29",
      periodEnd: "2026-07-28",
      amountLimit: 200000,
    });

    expect(await budgetRepository.findActiveOn(familyId, "2026-06-29")).toEqual([budget]);
    expect(await budgetRepository.findActiveOn(familyId, "2026-07-15")).toEqual([budget]);
    expect(await budgetRepository.findActiveOn(familyId, "2026-07-28")).toEqual([budget]);
    expect(await budgetRepository.findActiveOn(familyId, "2026-06-28")).toEqual([]);
    expect(await budgetRepository.findActiveOn(familyId, "2026-07-29")).toEqual([]);
  });

  it("returns the budgets of the most recent cycle", async () => {
    const { budgetRepository, categoryRepository } = await setup();
    const familyId = crypto.randomUUID();
    const food = await categoryRepository.create({ familyId, parentId: null, name: "food" });
    const transport = await categoryRepository.create({ familyId, parentId: null, name: "transport" });
    await budgetRepository.create({
      familyId,
      categoryId: food.id,
      period: "2026-05-29",
      periodEnd: "2026-06-28",
      amountLimit: 100000,
    });
    const latestFood = await budgetRepository.create({
      familyId,
      categoryId: food.id,
      period: "2026-06-29",
      periodEnd: "2026-07-28",
      amountLimit: 200000,
    });
    const latestTransport = await budgetRepository.create({
      familyId,
      categoryId: transport.id,
      period: "2026-06-29",
      periodEnd: "2026-07-28",
      amountLimit: 50000,
    });

    const latest = await budgetRepository.findLatestCycle(familyId);

    expect(latest).toHaveLength(2);
    expect(latest).toEqual(expect.arrayContaining([latestFood, latestTransport]));
  });

  it("returns an empty latest cycle for a family without budgets", async () => {
    const { budgetRepository } = await setup();

    expect(await budgetRepository.findLatestCycle(crypto.randomUUID())).toEqual([]);
  });

  it("creates many budgets at once", async () => {
    const { budgetRepository, categoryRepository } = await setup();
    const familyId = crypto.randomUUID();
    const food = await categoryRepository.create({ familyId, parentId: null, name: "food" });
    const transport = await categoryRepository.create({ familyId, parentId: null, name: "transport" });

    await budgetRepository.createMany([
      { familyId, categoryId: food.id, period: "2026-06-29", periodEnd: "2026-07-28", amountLimit: 100000 },
      { familyId, categoryId: transport.id, period: "2026-06-29", periodEnd: "2026-07-28", amountLimit: 50000 },
    ]);

    expect(await budgetRepository.findActiveOn(familyId, "2026-07-10")).toHaveLength(2);
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
      periodEnd: "2026-07-31",
      amountLimit: 200000,
    });

    const initialStatus = await budgetRepository.getStatusActiveOn(familyId, "2026-07-15");
    expect(initialStatus).toEqual([
      {
        id: budget.id,
        categoryId: category.id,
        period: "2026-07-01",
        periodEnd: "2026-07-31",
        amountLimit: 200000,
        spent: 0,
      },
    ]);

    const { transaction } = await transactionRepository.create({
      familyId,
      accountId: account.id,
      categoryId: category.id,
      createdByUserId: userId,
      amount: -15000,
      description: "Groceries",
      occurredAt: "2026-07-10",
    });

    const afterCreate = await budgetRepository.getStatusActiveOn(familyId, "2026-07-15");
    expect(afterCreate[0]?.spent).toBe(15000);

    await transactionRepository.update(familyId, transaction.id, transaction, { amount: -40000 });

    const afterEdit = await budgetRepository.getStatusActiveOn(familyId, "2026-07-15");
    expect(afterEdit[0]?.spent).toBe(40000);

    await transactionRepository.delete(familyId, transaction.id, { ...transaction, amount: -40000 });

    const afterDelete = await budgetRepository.getStatusActiveOn(familyId, "2026-07-15");
    expect(afterDelete[0]?.spent).toBe(0);
  });

  it("excludes transactions outside the cycle and income transactions", async () => {
    const { budgetRepository, categoryRepository, accountRepository, transactionRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const category = await categoryRepository.create({ familyId, parentId: null, name: "food" });
    const account = await accountRepository.create({ familyId, name: "Checking", type: "checking" });
    await budgetRepository.create({
      familyId,
      categoryId: category.id,
      period: "2026-07-01",
      periodEnd: "2026-07-31",
      amountLimit: 200000,
    });

    await transactionRepository.create({
      familyId,
      accountId: account.id,
      categoryId: category.id,
      createdByUserId: userId,
      amount: -5000,
      description: "Outside cycle",
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

    const status = await budgetRepository.getStatusActiveOn(familyId, "2026-07-15");
    expect(status[0]?.spent).toBe(0);
  });

  it("sums expenses from subcategories into the parent category's budget", async () => {
    const { budgetRepository, categoryRepository, accountRepository, transactionRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const parent = await categoryRepository.create({ familyId, parentId: null, name: "food" });
    const child = await categoryRepository.create({ familyId, parentId: parent.id, name: "fast food" });
    const otherParent = await categoryRepository.create({ familyId, parentId: null, name: "transport" });
    const account = await accountRepository.create({ familyId, name: "Checking", type: "checking" });
    await budgetRepository.create({
      familyId,
      categoryId: parent.id,
      period: "2026-07-01",
      periodEnd: "2026-07-31",
      amountLimit: 200000,
    });

    await transactionRepository.create({
      familyId,
      accountId: account.id,
      categoryId: parent.id,
      createdByUserId: userId,
      amount: -15000,
      description: "Groceries",
      occurredAt: "2026-07-05",
    });
    await transactionRepository.create({
      familyId,
      accountId: account.id,
      categoryId: child.id,
      createdByUserId: userId,
      amount: -8000,
      description: "Burger",
      occurredAt: "2026-07-10",
    });
    await transactionRepository.create({
      familyId,
      accountId: account.id,
      categoryId: otherParent.id,
      createdByUserId: userId,
      amount: -3000,
      description: "Taxi",
      occurredAt: "2026-07-12",
    });

    const status = await budgetRepository.getStatusActiveOn(familyId, "2026-07-15");
    expect(status[0]?.spent).toBe(23000);
  });

  it("counts expenses on both boundary days of the cycle", async () => {
    const { budgetRepository, categoryRepository, accountRepository, transactionRepository, userId } = await setup();
    const familyId = crypto.randomUUID();
    const category = await categoryRepository.create({ familyId, parentId: null, name: "food" });
    const account = await accountRepository.create({ familyId, name: "Checking", type: "checking" });
    await budgetRepository.create({
      familyId,
      categoryId: category.id,
      period: "2026-06-29",
      periodEnd: "2026-07-28",
      amountLimit: 200000,
    });

    for (const [amount, occurredAt] of [
      [-1000, "2026-06-28"],
      [-2000, "2026-06-29"],
      [-4000, "2026-07-28"],
      [-8000, "2026-07-29"],
    ] as const) {
      await transactionRepository.create({
        familyId,
        accountId: account.id,
        categoryId: category.id,
        createdByUserId: userId,
        amount,
        description: null,
        occurredAt,
      });
    }

    const status = await budgetRepository.getStatusActiveOn(familyId, "2026-07-15");
    expect(status[0]?.spent).toBe(6000);
  });
});
