import { describe, expect, it } from "vitest";
import { createBudget } from "../../../../src/modules/budgets/application/create-budget";
import { InMemoryCategoryRepository } from "../../categories/in-memory-category-repository";
import { InMemoryBudgetRepository } from "../in-memory-budget-repository";

const setup = () => {
  const budgetRepository = new InMemoryBudgetRepository();
  const categoryRepository = new InMemoryCategoryRepository();
  return { budgetRepository, categoryRepository };
};

describe("createBudget", () => {
  it("creates a budget for a category and period", async () => {
    const { budgetRepository, categoryRepository } = setup();
    const category = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });

    const budget = await createBudget(
      { budgetRepository, categoryRepository },
      { familyId: "family-1", categoryId: category.id, period: "2026-07", amountLimit: 200000 },
    );

    expect(budget.period).toBe("2026-07-01");
    expect(budget.amountLimit).toBe(200000);
  });

  it("rejects an invalid period format", async () => {
    const { budgetRepository, categoryRepository } = setup();
    const category = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });

    await expect(
      createBudget(
        { budgetRepository, categoryRepository },
        { familyId: "family-1", categoryId: category.id, period: "2026-07-01", amountLimit: 200000 },
      ),
    ).rejects.toThrow("period must be in 'YYYY-MM' format");
  });

  it("rejects a zero or negative amount limit", async () => {
    const { budgetRepository, categoryRepository } = setup();
    const category = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });

    await expect(
      createBudget(
        { budgetRepository, categoryRepository },
        { familyId: "family-1", categoryId: category.id, period: "2026-07", amountLimit: 0 },
      ),
    ).rejects.toThrow("amountLimit must be greater than zero");
  });

  it("rejects a category from another family", async () => {
    const { budgetRepository, categoryRepository } = setup();
    const category = await categoryRepository.create({ familyId: "family-2", parentId: null, name: "food" });

    await expect(
      createBudget(
        { budgetRepository, categoryRepository },
        { familyId: "family-1", categoryId: category.id, period: "2026-07", amountLimit: 200000 },
      ),
    ).rejects.toThrow("Category not found");
  });

  it("rejects a duplicate budget for the same category and period", async () => {
    const { budgetRepository, categoryRepository } = setup();
    const category = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    await createBudget(
      { budgetRepository, categoryRepository },
      { familyId: "family-1", categoryId: category.id, period: "2026-07", amountLimit: 200000 },
    );

    await expect(
      createBudget(
        { budgetRepository, categoryRepository },
        { familyId: "family-1", categoryId: category.id, period: "2026-07", amountLimit: 100000 },
      ),
    ).rejects.toThrow("A budget for this category and period already exists");
  });
});
