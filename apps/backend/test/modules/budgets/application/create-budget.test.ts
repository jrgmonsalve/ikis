import { describe, expect, it } from "vitest";
import { createBudget } from "../../../../src/modules/budgets/application/create-budget";
import { InMemoryCategoryRepository } from "../../categories/in-memory-category-repository";
import { InMemoryFamilyRepository } from "../../families/in-memory-family-repository";
import { InMemoryBudgetRepository } from "../in-memory-budget-repository";

const setup = (budgetCycleEndDay = 31) => {
  const budgetRepository = new InMemoryBudgetRepository();
  const categoryRepository = new InMemoryCategoryRepository();
  const familyRepository = new InMemoryFamilyRepository();
  familyRepository.families.push({ id: "family-1", name: "F1", budgetCycleEndDay, definedCycleStart: null, definedCycleEnd: null, createdAt: new Date() });
  familyRepository.families.push({ id: "family-2", name: "F2", budgetCycleEndDay: 31, definedCycleStart: null, definedCycleEnd: null, createdAt: new Date() });
  return { budgetRepository, categoryRepository, familyRepository };
};

describe("createBudget", () => {
  it("creates a budget in the cycle that contains today", async () => {
    const deps = setup();
    const category = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });

    const budget = await createBudget(deps, {
      familyId: "family-1",
      categoryId: category.id,
      amountLimit: 200000,
      today: "2026-07-07",
    });

    expect(budget.period).toBe("2026-07-01");
    expect(budget.periodEnd).toBe("2026-07-31");
    expect(budget.amountLimit).toBe(200000);
  });

  it("uses the family's budgetCycleEndDay to shape the cycle", async () => {
    const deps = setup(28);
    const category = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });

    const budget = await createBudget(deps, {
      familyId: "family-1",
      categoryId: category.id,
      amountLimit: 200000,
      today: "2026-07-07",
    });

    expect(budget.period).toBe("2026-06-29");
    expect(budget.periodEnd).toBe("2026-07-28");
  });

  it("joins the already-materialized cycle even after the family changes its end day", async () => {
    const deps = setup(15);
    const food = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    const transport = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "transport" });
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: food.id,
      period: "2026-06-29",
      periodEnd: "2026-07-28",
      amountLimit: 100000,
    });

    const budget = await createBudget(deps, {
      familyId: "family-1",
      categoryId: transport.id,
      amountLimit: 50000,
      today: "2026-07-07",
    });

    expect(budget.period).toBe("2026-06-29");
    expect(budget.periodEnd).toBe("2026-07-28");
  });

  it("chains the new cycle contiguously after the latest stored one", async () => {
    const deps = setup(28);
    const food = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    const transport = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "transport" });
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: food.id,
      period: "2026-06-29",
      periodEnd: "2026-07-28",
      amountLimit: 100000,
    });

    const budget = await createBudget(deps, {
      familyId: "family-1",
      categoryId: transport.id,
      amountLimit: 50000,
      today: "2026-08-05",
    });

    expect(budget.period).toBe("2026-07-29");
    expect(budget.periodEnd).toBe("2026-08-28");
  });

  it("rolls the previous cycle's budgets forward before adding the new one", async () => {
    const deps = setup(28);
    const food = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    const transport = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "transport" });
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: food.id,
      period: "2026-06-29",
      periodEnd: "2026-07-28",
      amountLimit: 100000,
    });

    await createBudget(deps, {
      familyId: "family-1",
      categoryId: transport.id,
      amountLimit: 50000,
      today: "2026-08-05",
    });

    const active = await deps.budgetRepository.findActiveOn("family-1", "2026-08-05");
    expect(active).toHaveLength(2);
    expect(active.find((budget) => budget.categoryId === food.id)?.amountLimit).toBe(100000);
  });

  it("rejects a zero or negative amount limit", async () => {
    const deps = setup();
    const category = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });

    await expect(
      createBudget(deps, { familyId: "family-1", categoryId: category.id, amountLimit: 0, today: "2026-07-07" }),
    ).rejects.toThrow("amountLimit must be greater than zero");
  });

  it("rejects a subcategory — budgets can only be created for parent categories", async () => {
    const deps = setup();
    const parent = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    const child = await deps.categoryRepository.create({ familyId: "family-1", parentId: parent.id, name: "fast food" });

    await expect(
      createBudget(deps, { familyId: "family-1", categoryId: child.id, amountLimit: 200000, today: "2026-07-07" }),
    ).rejects.toThrow("Budgets can only be created for parent categories");
  });

  it("rejects a category from another family", async () => {
    const deps = setup();
    const category = await deps.categoryRepository.create({ familyId: "family-2", parentId: null, name: "food" });

    await expect(
      createBudget(deps, { familyId: "family-1", categoryId: category.id, amountLimit: 200000, today: "2026-07-07" }),
    ).rejects.toThrow("Category not found");
  });

  it("rejects a duplicate budget for the same category in the current cycle", async () => {
    const deps = setup();
    const category = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    await createBudget(deps, { familyId: "family-1", categoryId: category.id, amountLimit: 200000, today: "2026-07-07" });

    await expect(
      createBudget(deps, { familyId: "family-1", categoryId: category.id, amountLimit: 100000, today: "2026-07-07" }),
    ).rejects.toThrow("A budget for this category already exists in the current cycle");
  });
});
