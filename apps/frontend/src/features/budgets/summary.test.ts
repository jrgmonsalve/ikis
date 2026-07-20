import { describe, expect, it } from "vitest";
import type { BudgetStatus } from "./api";
import { calculateUnassignedFunds, sortBudgetStatusByExecution, sumBudgetAvailable, sumBudgetLimit } from "./summary";

function budget(amountLimit: number, spent: number): BudgetStatus {
  return { id: "b1", categoryId: "c1", period: "2026-07", periodEnd: "2026-07-31", amountLimit, spent };
}

describe("sumBudgetAvailable", () => {
  it("sums the remaining amount per budget, not the original limit", () => {
    expect(sumBudgetAvailable([budget(800, 300)])).toBe(500);
  });

  it("returns 0 for an empty list", () => {
    expect(sumBudgetAvailable([])).toBe(0);
  });
});

describe("sumBudgetLimit", () => {
  it("sums the defined limit per budget, ignoring how much was spent", () => {
    expect(sumBudgetLimit([budget(800, 300), budget(200, 200)])).toBe(1000);
  });

  it("returns 0 for an empty list", () => {
    expect(sumBudgetLimit([])).toBe(0);
  });
});

describe("sortBudgetStatusByExecution", () => {
  it("orders budgets by execution from lowest to highest", () => {
    const budgets = [
      { ...budget(100, 75), id: "three-quarters" },
      { ...budget(100, 25), id: "one-quarter" },
      { ...budget(100, 50), id: "half" },
    ];

    expect(sortBudgetStatusByExecution(budgets).map((item) => item.id)).toEqual(["one-quarter", "half", "three-quarters"]);
  });

  it("uses the largest limit first when execution is tied", () => {
    const budgets = [
      { ...budget(100, 50), id: "small-limit" },
      { ...budget(800, 400), id: "large-limit" },
      { ...budget(400, 200), id: "medium-limit" },
    ];

    expect(sortBudgetStatusByExecution(budgets).map((item) => item.id)).toEqual([
      "large-limit",
      "medium-limit",
      "small-limit",
    ]);
  });

  it("keeps the received order when execution and limit are tied", () => {
    const budgets = [
      { ...budget(200, 100), id: "first" },
      { ...budget(200, 100), id: "second" },
    ];

    expect(sortBudgetStatusByExecution(budgets).map((item) => item.id)).toEqual(["first", "second"]);
  });
});

describe("calculateUnassignedFunds", () => {
  it("stays stable as spending happens within budgeted limits", () => {
    const beforeSpending = calculateUnassignedFunds(1000, [budget(800, 0)]);
    const afterSpending = calculateUnassignedFunds(700, [budget(800, 300)]);

    expect(beforeSpending).toBe(200);
    expect(afterSpending).toBe(200);
  });

  it("goes negative once spending exceeds the remaining budget", () => {
    expect(calculateUnassignedFunds(400, [budget(800, 300)])).toBe(-100);
  });
});
