import { describe, expect, it } from "vitest";
import { getBudgetStatus } from "../../../../src/modules/budgets/application/get-budget-status";
import { InMemoryFamilyRepository } from "../../families/in-memory-family-repository";
import { InMemoryBudgetRepository } from "../in-memory-budget-repository";

const setup = (budgetCycleEndDay = 28) => {
  const budgetRepository = new InMemoryBudgetRepository();
  const familyRepository = new InMemoryFamilyRepository();
  familyRepository.families.push({ id: "family-1", name: "F1", budgetCycleEndDay, createdAt: new Date() });
  return { budgetRepository, familyRepository };
};

describe("getBudgetStatus", () => {
  it("rejects an invalid date format", async () => {
    const deps = setup();

    await expect(getBudgetStatus(deps, { familyId: "family-1", date: "2026-07", today: "2026-07-07" })).rejects.toThrow(
      "date must be in 'YYYY-MM-DD' format",
    );
  });

  it("returns the budgets whose stored cycle contains the date", async () => {
    const deps = setup();
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: "cat-1",
      period: "2026-06-29",
      periodEnd: "2026-07-28",
      amountLimit: 1000,
    });

    const status = await getBudgetStatus(deps, { familyId: "family-1", date: "2026-07-07", today: "2026-07-07" });

    expect(status).toHaveLength(1);
    expect(status[0]?.amountLimit).toBe(1000);
    expect(status[0]?.period).toBe("2026-06-29");
    expect(status[0]?.periodEnd).toBe("2026-07-28");
  });

  it("rolls the latest cycle's budgets forward into the cycle that contains today", async () => {
    const deps = setup();
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: "cat-1",
      period: "2026-06-29",
      periodEnd: "2026-07-28",
      amountLimit: 1000,
    });

    const status = await getBudgetStatus(deps, { familyId: "family-1", date: "2026-08-05", today: "2026-08-05" });

    expect(status).toHaveLength(1);
    expect(status[0]?.period).toBe("2026-07-29");
    expect(status[0]?.periodEnd).toBe("2026-08-28");
    expect(status[0]?.amountLimit).toBe(1000);
  });

  it("skips missed cycles instead of backfilling them", async () => {
    const deps = setup();
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: "cat-1",
      period: "2026-06-29",
      periodEnd: "2026-07-28",
      amountLimit: 1000,
    });

    const current = await getBudgetStatus(deps, { familyId: "family-1", date: "2026-10-05", today: "2026-10-05" });
    expect(current).toHaveLength(1);
    expect(current[0]?.period).toBe("2026-09-29");
    expect(current[0]?.periodEnd).toBe("2026-10-28");

    const skipped = await getBudgetStatus(deps, { familyId: "family-1", date: "2026-08-15", today: "2026-10-05" });
    expect(skipped).toHaveLength(0);
  });

  it("never rewrites a stored cycle after the family changes its end day", async () => {
    const deps = setup(15);
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: "cat-1",
      period: "2026-06-29",
      periodEnd: "2026-07-28",
      amountLimit: 1000,
    });

    const status = await getBudgetStatus(deps, { familyId: "family-1", date: "2026-07-10", today: "2026-07-10" });

    expect(status).toHaveLength(1);
    expect(status[0]?.period).toBe("2026-06-29");
    expect(status[0]?.periodEnd).toBe("2026-07-28");
  });

  it("shapes the next cycle with the new end day after a settings change", async () => {
    const deps = setup(15);
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: "cat-1",
      period: "2026-06-29",
      periodEnd: "2026-07-28",
      amountLimit: 1000,
    });

    const status = await getBudgetStatus(deps, { familyId: "family-1", date: "2026-08-05", today: "2026-08-05" });

    expect(status).toHaveLength(1);
    expect(status[0]?.period).toBe("2026-07-29");
    expect(status[0]?.periodEnd).toBe("2026-08-15");
  });

  it("returns an empty list when the family has no budgets at all", async () => {
    const deps = setup();

    const status = await getBudgetStatus(deps, { familyId: "family-1", date: "2026-07-07", today: "2026-07-07" });

    expect(status).toHaveLength(0);
  });

  it("does not materialize future cycles", async () => {
    const deps = setup();
    await deps.budgetRepository.create({
      familyId: "family-1",
      categoryId: "cat-1",
      period: "2026-06-29",
      periodEnd: "2026-07-28",
      amountLimit: 1000,
    });

    const status = await getBudgetStatus(deps, { familyId: "family-1", date: "2026-09-10", today: "2026-07-07" });

    expect(status).toHaveLength(0);
    expect(deps.budgetRepository.budgets).toHaveLength(1);
  });
});
