export type Budget = {
  id: string;
  familyId: string;
  categoryId: string;
  /** Storage format, always the first day of the month: 'YYYY-MM-01'. */
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

export const toStoragePeriod = (period: string): string => `${period}-01`;

export const nextMonthStart = (storagePeriod: string): string => {
  const year = Number(storagePeriod.slice(0, 4));
  const month = Number(storagePeriod.slice(5, 7));
  return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
};
