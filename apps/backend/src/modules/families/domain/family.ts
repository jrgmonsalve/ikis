export type Family = {
  id: string;
  name: string;
  /** Day of the month (1-31) the budget cycle closes; 29-31 clamp to each month's last day. */
  budgetCycleEndDay: number;
  createdAt: Date;
};

export const assertValidBudgetCycleEndDay = (day: number): void => {
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new Error("budgetCycleEndDay must be an integer between 1 and 31");
  }
};
