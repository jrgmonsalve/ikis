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

  it("converts the public period to the storage format before querying", async () => {
    const budgetRepository = new InMemoryBudgetRepository();
    await budgetRepository.create({ familyId: "family-1", categoryId: "cat-1", period: "2026-07-01", amountLimit: 1000 });

    const status = await getBudgetStatus({ budgetRepository }, { familyId: "family-1", period: "2026-07" });

    expect(status).toHaveLength(1);
    expect(status[0]?.amountLimit).toBe(1000);
  });
});
