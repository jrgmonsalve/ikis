import { describe, expect, it } from "vitest";
import { nextCycleStart, toStoragePeriod } from "../../../../src/modules/budgets/domain/budget";

describe("toStoragePeriod", () => {
  it("appends '01' when the cycle starts on the 1st", () => {
    expect(toStoragePeriod("2026-07", 1)).toBe("2026-07-01");
  });

  it("appends the family's custom cycle start day", () => {
    expect(toStoragePeriod("2026-07", 27)).toBe("2026-07-27");
  });

  it("pads single-digit days", () => {
    expect(toStoragePeriod("2026-07", 5)).toBe("2026-07-05");
  });
});

describe("nextCycleStart", () => {
  it("advances to the same day next month", () => {
    expect(nextCycleStart("2026-07-01")).toBe("2026-08-01");
    expect(nextCycleStart("2026-07-27")).toBe("2026-08-27");
  });

  it("rolls over into the next year from December", () => {
    expect(nextCycleStart("2026-12-27")).toBe("2027-01-27");
  });
});
