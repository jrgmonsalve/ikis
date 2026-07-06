export type Budget = {
  id: string;
  familyId: string;
  categoryId: string;
  /** First day of the cycle, inclusive ('YYYY-MM-DD'). */
  period: string;
  /** Last day of the cycle, inclusive ('YYYY-MM-DD'). */
  periodEnd: string;
  amountLimit: number;
  createdAt: Date;
};

export type BudgetStatus = {
  id: string;
  categoryId: string;
  period: string;
  periodEnd: string;
  amountLimit: number;
  spent: number;
};

export type CycleRange = {
  start: string;
  end: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const assertValidDate = (date: string): void => {
  if (!DATE_PATTERN.test(date)) {
    throw new Error("date must be in 'YYYY-MM-DD' format");
  }
};

export const assertValidAmountLimit = (amountLimit: number): void => {
  if (amountLimit <= 0) {
    throw new Error("amountLimit must be greater than zero");
  }
};

const pad = (value: number): string => String(value).padStart(2, "0");

const lastDayOfMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** cycleEndDay 29-31 clamps to the month's last day (e.g. 31 → Feb 28). */
export const cycleEndForMonth = (cycleEndDay: number, year: number, month: number): string =>
  `${year}-${pad(month)}-${pad(Math.min(cycleEndDay, lastDayOfMonth(year, month)))}`;

const addDays = (date: string, days: number): string => {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
};

const cycleEndOnOrAfter = (cycleEndDay: number, date: string): string => {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const candidate = cycleEndForMonth(cycleEndDay, year, month);
  if (candidate >= date) {
    return candidate;
  }
  return month === 12 ? cycleEndForMonth(cycleEndDay, year + 1, 1) : cycleEndForMonth(cycleEndDay, year, month + 1);
};

export const cycleContaining = (cycleEndDay: number, date: string): CycleRange => {
  const end = cycleEndOnOrAfter(cycleEndDay, date);
  const endYear = Number(end.slice(0, 4));
  const endMonth = Number(end.slice(5, 7));
  const previousEnd =
    endMonth === 1 ? cycleEndForMonth(cycleEndDay, endYear - 1, 12) : cycleEndForMonth(cycleEndDay, endYear, endMonth - 1);
  return { start: addDays(previousEnd, 1), end };
};

export const nextCycleAfter = (cycleEndDay: number, previousEnd: string): CycleRange => {
  const start = addDays(previousEnd, 1);
  return { start, end: cycleEndOnOrAfter(cycleEndDay, start) };
};
