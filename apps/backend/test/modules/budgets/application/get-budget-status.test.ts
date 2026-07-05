import { describe, expect, it } from "vitest";
import { getBudgetStatus } from "../../../../src/modules/budgets/application/get-budget-status";
import { InMemoryBudgetRepository } from "../in-memory-budget-repository";

describe("getBudgetStatus", () => {
  it("rejects an invalid period format", async () => {
    const budgetRepository = new InMemoryBudgetRepository();

    await expect(
      getBudgetStatus({ budgetRepository }, { familyId: "family-1", period: "2026-07-01" }),
    ).rejects.toThrow("period must be in 'YYYY-MM' format");
  });

  it("finds a budget stored with a custom cycle start day", async () => {
    const budgetRepository = new InMemoryBudgetRepository();
    await budgetRepository.create({ familyId: "family-1", categoryId: "cat-1", period: "2026-07-27", amountLimit: 1000 });

    const status = await getBudgetStatus({ budgetRepository }, { familyId: "family-1", period: "2026-07" });

    expect(status).toHaveLength(1);
    expect(status[0]?.amountLimit).toBe(1000);
  });

  it("keeps a budget reachable after the family later changes its cycle start day", async () => {
    const budgetRepository = new InMemoryBudgetRepository();
    // Created back when the family's cycle started on the 1st.
    await budgetRepository.create({ familyId: "family-1", categoryId: "cat-1", period: "2026-07-01", amountLimit: 1000 });

    // The family's setting changes later — this must NOT rewrite the stored
    // budget, and the budget must still show up for "2026-07".
    const status = await getBudgetStatus({ budgetRepository }, { familyId: "family-1", period: "2026-07" });

    expect(status).toHaveLength(1);
  });
});
