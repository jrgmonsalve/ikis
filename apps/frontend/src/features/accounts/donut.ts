import type { Account } from "./api";

export type AccountDonutSlice = {
  account: Account;
  pct: number;
  start: number;
  end: number;
  color: string;
};

export type AccountDonutChart = {
  totalBalance: number;
  slices: AccountDonutSlice[];
  gradient: string;
};

const CHART_COLORS = ["#e11d48", "#16a34a", "#eab308", "#2563eb", "#f97316", "#0d9488", "#9333ea"];

export function buildAccountDonutChart(accounts: Account[]): AccountDonutChart {
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalForChart = accounts.reduce((sum, account) => sum + Math.max(account.balance, 0), 0);

  let cumulative = 0;
  const slices = accounts.map((account, index) => {
    const value = Math.max(account.balance, 0);
    const pct = totalForChart > 0 ? (value / totalForChart) * 100 : 0;
    const start = cumulative;
    cumulative += pct;
    return { account, pct, start, end: cumulative, color: CHART_COLORS[index % CHART_COLORS.length] };
  });

  const gradient =
    totalForChart > 0
      ? slices.map((slice) => `${slice.color} ${slice.start}% ${slice.end}%`).join(", ")
      : "var(--muted) 0% 100%";

  return { totalBalance, slices, gradient };
}
