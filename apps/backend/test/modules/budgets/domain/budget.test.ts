import { describe, expect, it } from "vitest";
import { assertValidDate, cycleContaining, cycleEndForMonth, nextCycleAfter } from "../../../../src/modules/budgets/domain/budget";

describe("assertValidDate", () => {
  it("accepts a 'YYYY-MM-DD' date", () => {
    expect(() => assertValidDate("2026-07-28")).not.toThrow();
  });

  it("rejects a 'YYYY-MM' month", () => {
    expect(() => assertValidDate("2026-07")).toThrow("date must be in 'YYYY-MM-DD' format");
  });
});

describe("cycleEndForMonth", () => {
  it("uses the configured end day when the month has it", () => {
    expect(cycleEndForMonth(28, 2026, 7)).toBe("2026-07-28");
    expect(cycleEndForMonth(5, 2026, 11)).toBe("2026-11-05");
  });

  it("clamps 29-31 to the month's last day", () => {
    expect(cycleEndForMonth(31, 2026, 2)).toBe("2026-02-28");
    expect(cycleEndForMonth(31, 2028, 2)).toBe("2028-02-29");
    expect(cycleEndForMonth(31, 2026, 4)).toBe("2026-04-30");
    expect(cycleEndForMonth(30, 2026, 2)).toBe("2026-02-28");
  });
});

describe("cycleContaining", () => {
  it("returns the cycle whose end day has not passed yet", () => {
    expect(cycleContaining(28, "2026-07-07")).toEqual({ start: "2026-06-29", end: "2026-07-28" });
  });

  it("includes the end day itself", () => {
    expect(cycleContaining(28, "2026-07-28")).toEqual({ start: "2026-06-29", end: "2026-07-28" });
  });

  it("rolls into the next month right after the end day", () => {
    expect(cycleContaining(28, "2026-07-29")).toEqual({ start: "2026-07-29", end: "2026-08-28" });
  });

  it("maps end day 31 to full calendar months", () => {
    expect(cycleContaining(31, "2026-07-15")).toEqual({ start: "2026-07-01", end: "2026-07-31" });
    expect(cycleContaining(31, "2026-02-10")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
  });

  it("crosses year boundaries", () => {
    expect(cycleContaining(28, "2026-12-30")).toEqual({ start: "2026-12-29", end: "2027-01-28" });
    expect(cycleContaining(28, "2027-01-10")).toEqual({ start: "2026-12-29", end: "2027-01-28" });
  });
});

describe("nextCycleAfter", () => {
  it("starts the day after the previous end and closes on the configured day", () => {
    expect(nextCycleAfter(28, "2026-07-28")).toEqual({ start: "2026-07-29", end: "2026-08-28" });
  });

  it("keeps cycles contiguous when the end day moves earlier", () => {
    expect(nextCycleAfter(15, "2026-08-28")).toEqual({ start: "2026-08-29", end: "2026-09-15" });
  });

  it("allows a short transition cycle when the end day moves later within the same month", () => {
    expect(nextCycleAfter(31, "2026-08-28")).toEqual({ start: "2026-08-29", end: "2026-08-31" });
  });

  it("clamps February when chaining from a day-31 cycle", () => {
    expect(nextCycleAfter(31, "2026-01-31")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
  });

  it("crosses year boundaries", () => {
    expect(nextCycleAfter(28, "2026-12-28")).toEqual({ start: "2026-12-29", end: "2027-01-28" });
  });
});
