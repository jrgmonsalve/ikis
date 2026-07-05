import { describe, expect, it } from "vitest";
import { assertValidBudgetCycleStartDay } from "../../../../src/modules/families/domain/family";

describe("assertValidBudgetCycleStartDay", () => {
  it("accepts days between 1 and 28", () => {
    expect(() => assertValidBudgetCycleStartDay(1)).not.toThrow();
    expect(() => assertValidBudgetCycleStartDay(27)).not.toThrow();
    expect(() => assertValidBudgetCycleStartDay(28)).not.toThrow();
  });

  it("rejects 0, negative, non-integer, and days above 28", () => {
    expect(() => assertValidBudgetCycleStartDay(0)).toThrow();
    expect(() => assertValidBudgetCycleStartDay(-1)).toThrow();
    expect(() => assertValidBudgetCycleStartDay(1.5)).toThrow();
    expect(() => assertValidBudgetCycleStartDay(29)).toThrow();
    expect(() => assertValidBudgetCycleStartDay(31)).toThrow();
  });
});
