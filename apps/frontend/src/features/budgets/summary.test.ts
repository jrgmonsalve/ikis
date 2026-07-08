import { describe, expect, it } from "vitest";
import type { BudgetStatus } from "./api";
import { calculateUnassignedFunds, sumBudgetAvailable } from "./summary";

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
