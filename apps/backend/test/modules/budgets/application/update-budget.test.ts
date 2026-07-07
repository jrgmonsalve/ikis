import { describe, expect, it } from "vitest";
import { createBudget } from "../../../../src/modules/budgets/application/create-budget";
import { updateBudget } from "../../../../src/modules/budgets/application/update-budget";
import { InMemoryCategoryRepository } from "../../categories/in-memory-category-repository";
import { InMemoryFamilyRepository } from "../../families/in-memory-family-repository";
import { InMemoryBudgetRepository } from "../in-memory-budget-repository";

const setup = () => {
  const budgetRepository = new InMemoryBudgetRepository();
  const categoryRepository = new InMemoryCategoryRepository();
  const familyRepository = new InMemoryFamilyRepository();
  familyRepository.families.push({ id: "family-1", name: "F1", budgetCycleEndDay: 31, definedCycleStart: null, definedCycleEnd: null, createdAt: new Date() });
  return { budgetRepository, categoryRepository, familyRepository };
};

describe("updateBudget", () => {
  it("updates the amount limit", async () => {
    const { budgetRepository, categoryRepository, familyRepository } = setup();
    const category = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    const budget = await createBudget(
      { budgetRepository, categoryRepository, familyRepository },
      { familyId: "family-1", categoryId: category.id, amountLimit: 200000, today: "2026-07-07" },
    );

    const updated = await updateBudget(
      { budgetRepository },
      { familyId: "family-1", id: budget.id, changes: { amountLimit: 300000 } },
    );

    expect(updated.amountLimit).toBe(300000);
  });

  it("rejects a zero or negative amount limit", async () => {
    const { budgetRepository, categoryRepository, familyRepository } = setup();
    const category = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    const budget = await createBudget(
      { budgetRepository, categoryRepository, familyRepository },
      { familyId: "family-1", categoryId: category.id, amountLimit: 200000, today: "2026-07-07" },
    );

    await expect(
      updateBudget({ budgetRepository }, { familyId: "family-1", id: budget.id, changes: { amountLimit: -1 } }),
    ).rejects.toThrow("amountLimit must be greater than zero");
  });

  it("rejects updating a budget from another family", async () => {
    const { budgetRepository, categoryRepository, familyRepository } = setup();
    const category = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    const budget = await createBudget(
      { budgetRepository, categoryRepository, familyRepository },
      { familyId: "family-1", categoryId: category.id, amountLimit: 200000, today: "2026-07-07" },
    );

    await expect(
      updateBudget({ budgetRepository }, { familyId: "family-2", id: budget.id, changes: { amountLimit: 1000 } }),
    ).rejects.toThrow("Budget not found");
  });
});
