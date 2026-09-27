import { describe, expect, it } from "vitest";
import {
  assertValidAmountLimit,
  assertValidDueDay,
  assertValidNotifyDaysBefore,
  assertValidPeriod,
  daysBetween,
  dueDateForPeriod,
  nextPeriod,
  periodOf,
} from "../../../../src/modules/commitments/domain/commitment";

describe("commitment domain", () => {
  it("computes the due date for a period, clamping to the month's last day", () => {
    expect(dueDateForPeriod(5, "2026-09")).toBe("2026-09-05");
    expect(dueDateForPeriod(31, "2026-02")).toBe("2026-02-28");
    expect(dueDateForPeriod(31, "2026-04")).toBe("2026-04-30");
  });

  it("computes the next period, rolling over the year boundary", () => {
    expect(nextPeriod("2026-09")).toBe("2026-10");
    expect(nextPeriod("2026-12")).toBe("2027-01");
  });

  it("extracts the period from a date", () => {
    expect(periodOf("2026-09-26")).toBe("2026-09");
  });

  it("computes days between two dates", () => {
    expect(daysBetween("2026-09-26", "2026-09-30")).toBe(4);
    expect(daysBetween("2026-09-26", "2026-09-20")).toBe(-6);
    expect(daysBetween("2026-09-26", "2026-09-26")).toBe(0);
  });

  it("rejects an invalid amountLimit", () => {
    expect(() => assertValidAmountLimit(0)).toThrow("amountLimit must be greater than zero");
    expect(() => assertValidAmountLimit(-1)).toThrow();
  });

  it("rejects an invalid dueDay", () => {
    expect(() => assertValidDueDay(0)).toThrow("dueDay must be an integer between 1 and 31");
    expect(() => assertValidDueDay(32)).toThrow();
    expect(() => assertValidDueDay(1.5)).toThrow();
  });

  it("rejects an invalid notifyDaysBefore", () => {
    expect(() => assertValidNotifyDaysBefore(-1)).toThrow("notifyDaysBefore must be a non-negative integer");
    expect(() => assertValidNotifyDaysBefore(1.5)).toThrow();
  });

  it("rejects an invalid period", () => {
    expect(() => assertValidPeriod("2026-9")).toThrow("period must be in 'YYYY-MM' format");
    expect(() => assertValidPeriod("2026-09-01")).toThrow();
  });
});
