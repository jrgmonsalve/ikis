export type Family = {
  id: string;
  name: string;
  /** Day of the month (1-28) a new budget cycle starts — e.g. payday. */
  budgetCycleStartDay: number;
  createdAt: Date;
};

export const assertValidBudgetCycleStartDay = (day: number): void => {
  if (!Number.isInteger(day) || day < 1 || day > 28) {
    throw new Error("budgetCycleStartDay must be an integer between 1 and 28");
  }
};
