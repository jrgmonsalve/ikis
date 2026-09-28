export type Commitment = {
  id: string;
  familyId: string;
  name: string;
  amountLimit: number;
  /** Day of the month (1-31) the commitment is due; 29-31 clamp to each month's last day. */
  dueDay: number;
  notifyDaysBefore: number;
  /** Account the payment transaction is created on when marked paid. */
  accountId: string;
  /** Category the payment transaction is created with, so it counts toward that category's budget. */
  categoryId: string | null;
  /** An archived commitment stops showing up as upcoming but keeps its payment history. */
  archivedAt: Date | null;
  createdAt: Date;
};

export type UpcomingCommitment = {
  id: string;
  name: string;
  amountLimit: number;
  period: string;
  dueDate: string;
  daysUntil: number;
};

export type CommitmentWithPaymentStatus = Commitment & {
  /** Calendar month ('YYYY-MM') this status refers to. */
  currentPeriod: string;
  paidThisPeriod: boolean;
};

export const assertValidAmountLimit = (amountLimit: number): void => {
  if (amountLimit <= 0) {
    throw new Error("amountLimit must be greater than zero");
  }
};

export const assertValidDueDay = (dueDay: number): void => {
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    throw new Error("dueDay must be an integer between 1 and 31");
  }
};

export const assertValidNotifyDaysBefore = (notifyDaysBefore: number): void => {
  if (!Number.isInteger(notifyDaysBefore) || notifyDaysBefore < 0) {
    throw new Error("notifyDaysBefore must be a non-negative integer");
  }
};

const PERIOD_PATTERN = /^\d{4}-\d{2}$/;

export const assertValidPeriod = (period: string): void => {
  if (!PERIOD_PATTERN.test(period)) {
    throw new Error("period must be in 'YYYY-MM' format");
  }
};

const pad = (value: number): string => String(value).padStart(2, "0");

const lastDayOfMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate();

export const periodOf = (date: string): string => date.slice(0, 7);

export const nextPeriod = (period: string): string => {
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5, 7));
  return month === 12 ? `${year + 1}-01` : `${year}-${pad(month + 1)}`;
};

/** dueDay 29-31 clamps to the period's last day (e.g. 31 → Feb 28). */
export const dueDateForPeriod = (dueDay: number, period: string): string => {
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5, 7));
  return `${period}-${pad(Math.min(dueDay, lastDayOfMonth(year, month)))}`;
};

/**
 * The first period a commitment can be due for. If the current period's due date
 * already fell before the commitment was created, there was no way to have tracked
 * it, so it starts at the next period instead of showing up already overdue.
 */
export const startingPeriodFor = (dueDay: number, createdAt: Date, today: string): string => {
  const period = periodOf(today);
  const createdDate = createdAt.toISOString().slice(0, 10);
  return dueDateForPeriod(dueDay, period) < createdDate ? nextPeriod(period) : period;
};

export const daysBetween = (from: string, to: string): number => {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
};
