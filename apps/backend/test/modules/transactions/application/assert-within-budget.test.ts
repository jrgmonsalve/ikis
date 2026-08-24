import { describe, expect, it } from "vitest";
import { assertWithinBudget, BudgetExceededError } from "../../../../src/modules/transactions/application/assert-within-budget";
import type { Category } from "../../../../src/modules/categories/domain/category";
import { InMemoryFamilyRepository } from "../../families/in-memory-family-repository";
import { InMemoryBudgetRepository } from "../../budgets/in-memory-budget-repository";

const FAMILY_ID = "family-1";
const TODAY = "2026-08-23";

const rootCategory = (overrides: Partial<Category> = {}): Category => ({
  id: "category-1",
  familyId: FAMILY_ID,
  parentId: null,
  name: "food",
  createdAt: new Date(),
  ...overrides,
});

const setup = () => {
  const familyRepository = new InMemoryFamilyRepository();
  familyRepository.families.push({
    id: FAMILY_ID,
    name: "Garcia",
    budgetCycleEndDay: 31,
    definedCycleStart: null,
    definedCycleEnd: null,
    createdAt: new Date(),
  });
  return { familyRepository };
};

describe("assertWithinBudget", () => {
  it("allows an expense within the remaining budget", async () => {
    const { familyRepository } = setup();
    const budgetRepository = new InMemoryBudgetRepository();
    await budgetRepository.create({
      familyId: FAMILY_ID,
      categoryId: "category-1",
      period: "2026-08-01",
      periodEnd: "2026-08-31",
      amountLimit: 100000,
    });

    await expect(
      assertWithinBudget(
        { budgetRepository, familyRepository },
        { familyId: FAMILY_ID, category: rootCategory(), occurredAt: "2026-08-10", requestedAmount: 50000, today: TODAY },
      ),
    ).resolves.toBeUndefined();
  });

  it("rejects an expense that exceeds the remaining budget", async () => {
    const { familyRepository } = setup();
    const budgetRepository = new InMemoryBudgetRepository();
    await budgetRepository.create({
      familyId: FAMILY_ID,
      categoryId: "category-1",
      period: "2026-08-01",
      periodEnd: "2026-08-31",
      amountLimit: 100000,
    });

    const check = assertWithinBudget(
      { budgetRepository, familyRepository },
      { familyId: FAMILY_ID, category: rootCategory(), occurredAt: "2026-08-10", requestedAmount: 150000, today: TODAY },
    );

    await expect(check).rejects.toBeInstanceOf(BudgetExceededError);
    await expect(check.catch((err) => err)).resolves.toMatchObject({ categoryId: "category-1", remaining: 100000 });
  });

  it("checks the parent category's budget when the transaction is on a subcategory", async () => {
    const { familyRepository } = setup();
    const budgetRepository = new InMemoryBudgetRepository();
    await budgetRepository.create({
      familyId: FAMILY_ID,
      categoryId: "category-1",
      period: "2026-08-01",
      periodEnd: "2026-08-31",
      amountLimit: 100000,
    });
    const subcategory = rootCategory({ id: "category-1-sub", parentId: "category-1" });

    await expect(
      assertWithinBudget(
        { budgetRepository, familyRepository },
        { familyId: FAMILY_ID, category: subcategory, occurredAt: "2026-08-10", requestedAmount: 150000, today: TODAY },
      ),
    ).rejects.toBeInstanceOf(BudgetExceededError);
  });

  it("allows the expense when the category has no budget defined", async () => {
    const { familyRepository } = setup();
    const budgetRepository = new InMemoryBudgetRepository();

    await expect(
      assertWithinBudget(
        { budgetRepository, familyRepository },
        { familyId: FAMILY_ID, category: rootCategory(), occurredAt: "2026-08-10", requestedAmount: 999999, today: TODAY },
      ),
    ).resolves.toBeUndefined();
  });

  it("excludes the transaction's own previous amount when editing within the same category and cycle", async () => {
    const { familyRepository } = setup();
    const budgetRepository = new InMemoryBudgetRepository([
      { familyId: FAMILY_ID, categoryId: "category-1", amount: -80000, occurredAt: "2026-08-10", deletedAt: null },
    ]);
    await budgetRepository.create({
      familyId: FAMILY_ID,
      categoryId: "category-1",
      period: "2026-08-01",
      periodEnd: "2026-08-31",
      amountLimit: 100000,
    });

    await expect(
      assertWithinBudget(
        { budgetRepository, familyRepository },
        {
          familyId: FAMILY_ID,
          category: rootCategory(),
          occurredAt: "2026-08-10",
          requestedAmount: 95000,
          excluding: { categoryId: "category-1", occurredAt: "2026-08-10", amount: -80000 },
          today: TODAY,
        },
      ),
    ).resolves.toBeUndefined();
  });

  it("does not exclude anything when the previous transaction belonged to a different category", async () => {
    const { familyRepository } = setup();
    const budgetRepository = new InMemoryBudgetRepository([
      { familyId: FAMILY_ID, categoryId: "category-1", amount: -80000, occurredAt: "2026-08-10", deletedAt: null },
    ]);
    await budgetRepository.create({
      familyId: FAMILY_ID,
      categoryId: "category-1",
      period: "2026-08-01",
      periodEnd: "2026-08-31",
      amountLimit: 100000,
    });

    await expect(
      assertWithinBudget(
        { budgetRepository, familyRepository },
        {
          familyId: FAMILY_ID,
          category: rootCategory(),
          occurredAt: "2026-08-10",
          requestedAmount: 95000,
          excluding: { categoryId: "category-2", occurredAt: "2026-08-10", amount: -80000 },
          today: TODAY,
        },
      ),
    ).rejects.toBeInstanceOf(BudgetExceededError);
  });
});
