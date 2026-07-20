import { describe, expect, it } from "vitest";
import type { Account } from "./api";
import { buildAccountDonutChart } from "./donut";

function account(id: string, balance: number): Account {
  return {
    id,
    familyId: "f1",
    name: id,
    type: "checking",
    currency: "COP",
    balance,
    archivedAt: null,
    createdAt: "2026-01-01",
  };
}

describe("buildAccountDonutChart", () => {
  it("falls back to a muted full circle when there is no positive balance to chart", () => {
    const chart = buildAccountDonutChart([]);
    expect(chart.gradient).toBe("var(--muted) 0% 100%");
    expect(chart.totalBalance).toBe(0);
  });

  it("still shows the muted circle when every account is in the red", () => {
    const chart = buildAccountDonutChart([account("debt", -500)]);
    expect(chart.gradient).toBe("var(--muted) 0% 100%");
    expect(chart.totalBalance).toBe(-500);
    expect(chart.slices[0].pct).toBe(0);
  });

  it("includes negative balances in the total but excludes them from the chart weight", () => {
    const chart = buildAccountDonutChart([account("savings", 300), account("credit", -100)]);
    expect(chart.totalBalance).toBe(200);
    expect(chart.slices.map((slice) => slice.pct)).toEqual([100, 0]);
  });

  it("splits proportional slices across contiguous start/end ranges", () => {
    const chart = buildAccountDonutChart([account("a", 300), account("b", 100)]);
    expect(chart.slices).toMatchObject([
      { pct: 75, start: 0, end: 75 },
      { pct: 25, start: 75, end: 100 },
    ]);
    expect(chart.gradient).toContain("0% 75%");
    expect(chart.gradient).toContain("75% 100%");
  });

  it("cycles through the color palette once accounts outnumber the available colors", () => {
    const accounts = Array.from({ length: 8 }, (_, index) => account(`acc-${index}`, 100));
    const chart = buildAccountDonutChart(accounts);
    expect(chart.slices[0].color).toBe(chart.slices[7].color);
  });
});
