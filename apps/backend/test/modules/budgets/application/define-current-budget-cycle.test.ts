import { describe, expect, it } from "vitest";
import { defineCurrentBudgetCycle } from "../../../../src/modules/budgets/application/define-current-budget-cycle";
import { InMemoryFamilyRepository } from "../../families/in-memory-family-repository";
import { InMemoryBudgetRepository } from "../in-memory-budget-repository";

const setup = (budgetCycleEndDay = 31) => {
  const budgetRepository = new InMemoryBudgetRepository();
  const familyRepository = new InMemoryFamilyRepository();
  familyRepository.families.push({ id: "family-1", name: "F1", budgetCycleEndDay, definedCycleStart: null, definedCycleEnd: null, createdAt: new Date() });
  return { budgetRepository, familyRepository };
};

describe("defineCurrentBudgetCycle", () => {
  it("re-dates the current cycle's budgets and stores the closing day", async () => {
    const deps = setup();
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: "cat-1",
      period: "2026-07-01",
      periodEnd: "2026-07-31",
      amountLimit: 100000,
    });

    const cycle = await defineCurrentBudgetCycle(deps, {
      familyId: "family-1",
      start: "2026-07-07",
      end: "2026-07-28",
      today: "2026-07-07",
    });

    expect(cycle).toEqual({ start: "2026-07-07", end: "2026-07-28" });
    const [budget] = await deps.budgetRepository.findActiveOn("family-1", "2026-07-10");
    expect(budget?.period).toBe("2026-07-07");
    expect(budget?.periodEnd).toBe("2026-07-28");
    expect((await deps.familyRepository.findById("family-1"))?.budgetCycleEndDay).toBe(28);
  });

  it("shapes the following cycles with the new closing day", async () => {
    const deps = setup();
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: "cat-1",
      period: "2026-07-01",
      periodEnd: "2026-07-31",
      amountLimit: 100000,
    });

    await defineCurrentBudgetCycle(deps, {
      familyId: "family-1",
      start: "2026-07-07",
      end: "2026-07-28",
      today: "2026-07-07",
    });

    const { getBudgetStatus } = await import("../../../../src/modules/budgets/application/get-budget-status");
    const next = await getBudgetStatus(deps, { familyId: "family-1", date: "2026-08-05", today: "2026-08-05" });
    expect(next[0]?.period).toBe("2026-07-29");
    expect(next[0]?.periodEnd).toBe("2026-08-28");
  });

  it("persists the defined range on the family even without budgets", async () => {
    const deps = setup();

    const cycle = await defineCurrentBudgetCycle(deps, {
      familyId: "family-1",
      start: "2026-07-07",
      end: "2026-07-28",
      today: "2026-07-07",
    });

    expect(cycle).toEqual({ start: "2026-07-07", end: "2026-07-28" });
    const family = await deps.familyRepository.findById("family-1");
    expect(family?.budgetCycleEndDay).toBe(28);
    expect(family?.definedCycleStart).toBe("2026-07-07");
    expect(family?.definedCycleEnd).toBe("2026-07-28");
    expect(deps.budgetRepository.budgets).toHaveLength(0);
  });

  it("anchors the first budget to the range defined before any budget existed", async () => {
    const deps = setup();
    await defineCurrentBudgetCycle(deps, {
      familyId: "family-1",
      start: "2026-07-07",
      end: "2026-07-28",
      today: "2026-07-07",
    });

    const { createBudget } = await import("../../../../src/modules/budgets/application/create-budget");
    const { InMemoryCategoryRepository } = await import("../../categories/in-memory-category-repository");
    const categoryRepository = new InMemoryCategoryRepository();
    const category = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });

    const budget = await createBudget(
      { ...deps, categoryRepository },
      { familyId: "family-1", categoryId: category.id, amountLimit: 100000, today: "2026-07-10" },
    );

    expect(budget.period).toBe("2026-07-07");
    expect(budget.periodEnd).toBe("2026-07-28");
  });

  it("resolves the current cycle from the defined range when no budgets exist", async () => {
    const deps = setup();
    await defineCurrentBudgetCycle(deps, {
      familyId: "family-1",
      start: "2026-07-07",
      end: "2026-07-28",
      today: "2026-07-07",
    });

    const { getCurrentCycle } = await import("../../../../src/modules/budgets/application/get-current-cycle");
    expect(await getCurrentCycle(deps, { familyId: "family-1", today: "2026-07-10" })).toEqual({
      start: "2026-07-07",
      end: "2026-07-28",
    });
    expect(await getCurrentCycle(deps, { familyId: "family-1", today: "2026-08-05" })).toEqual({
      start: "2026-07-29",
      end: "2026-08-28",
    });
  });

  it("never touches already closed cycles", async () => {
    const deps = setup();
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: "cat-1",
      period: "2026-06-01",
      periodEnd: "2026-06-30",
      amountLimit: 100000,
    });
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: "cat-1",
      period: "2026-07-01",
      periodEnd: "2026-07-31",
      amountLimit: 100000,
    });

    await defineCurrentBudgetCycle(deps, {
      familyId: "family-1",
      start: "2026-07-07",
      end: "2026-07-28",
      today: "2026-07-07",
    });

    const june = await deps.budgetRepository.findActiveOn("family-1", "2026-06-15");
    expect(june[0]?.period).toBe("2026-06-01");
    expect(june[0]?.periodEnd).toBe("2026-06-30");
  });

  it("rejects a cycle that does not contain today", async () => {
    const deps = setup();

    await expect(
      defineCurrentBudgetCycle(deps, {
        familyId: "family-1",
        start: "2026-07-07",
        end: "2026-07-28",
        today: "2026-08-02",
      }),
    ).rejects.toThrow("The current cycle must contain today");
  });

  it("rejects a start after the end", async () => {
    const deps = setup();

    await expect(
      defineCurrentBudgetCycle(deps, {
        familyId: "family-1",
        start: "2026-07-28",
        end: "2026-07-07",
        today: "2026-07-15",
      }),
    ).rejects.toThrow("start must be on or before end");
  });

  it("rejects a cycle overlapping an already closed one", async () => {
    const deps = setup();
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: "cat-1",
      period: "2026-06-01",
      periodEnd: "2026-06-30",
      amountLimit: 100000,
    });
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: "cat-1",
      period: "2026-07-01",
      periodEnd: "2026-07-31",
      amountLimit: 100000,
    });

    await expect(
      defineCurrentBudgetCycle(deps, {
        familyId: "family-1",
        start: "2026-06-20",
        end: "2026-07-28",
        today: "2026-07-07",
      }),
    ).rejects.toThrow("The cycle would overlap an already closed cycle");
  });
});
