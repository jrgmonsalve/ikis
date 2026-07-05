export type Budget = {
  id: string;
  familyId: string;
  categoryId: string;
  /** Storage format 'YYYY-MM-DD' — the day is the family's budgetCycleStartDay, not necessarily 01. */
  period: string;
  amountLimit: number;
  createdAt: Date;
};

export type BudgetStatus = {
  id: string;
  categoryId: string;
  amountLimit: number;
  spent: number;
};

const PUBLIC_PERIOD_PATTERN = /^\d{4}-\d{2}$/;

/** The API surface uses 'YYYY-MM' (e.g. what an <input type="month"> produces). */
export const assertValidPeriod = (period: string): void => {
  if (!PUBLIC_PERIOD_PATTERN.test(period)) {
    throw new Error("period must be in 'YYYY-MM' format");
  }
};

export const assertValidAmountLimit = (amountLimit: number): void => {
  if (amountLimit <= 0) {
    throw new Error("amountLimit must be greater than zero");
  }
};

/**
 * A period cycle doesn't have to start on the 1st — a family can set its own
 * budgetCycleStartDay (e.g. payday). 'YYYY-MM' names the cycle that STARTS in
 * that calendar month.
 */
export const toStoragePeriod = (period: string, cycleStartDay: number): string =>
  `${period}-${String(cycleStartDay).padStart(2, "0")}`;

export const nextCycleStart = (storagePeriod: string): string => {
  const year = Number(storagePeriod.slice(0, 4));
  const month = Number(storagePeriod.slice(5, 7));
  const day = Number(storagePeriod.slice(8, 10));
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
};
