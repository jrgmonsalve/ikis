import { describe, expect, it } from "vitest";
import { assertValidBudgetCycleEndDay } from "../../../../src/modules/families/domain/family";

describe("assertValidBudgetCycleEndDay", () => {
  it("accepts days between 1 and 31", () => {
    expect(() => assertValidBudgetCycleEndDay(1)).not.toThrow();
    expect(() => assertValidBudgetCycleEndDay(28)).not.toThrow();
    expect(() => assertValidBudgetCycleEndDay(31)).not.toThrow();
  });

  it("rejects 0, negative, non-integer, and days above 31", () => {
    expect(() => assertValidBudgetCycleEndDay(0)).toThrow();
    expect(() => assertValidBudgetCycleEndDay(-1)).toThrow();
    expect(() => assertValidBudgetCycleEndDay(1.5)).toThrow();
    expect(() => assertValidBudgetCycleEndDay(32)).toThrow();
  });
});
