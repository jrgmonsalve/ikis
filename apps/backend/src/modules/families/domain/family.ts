export type Family = {
  id: string;
  name: string;
  /** Day of the month (1-31) the budget cycle closes; 29-31 clamp to each month's last day. */
  budgetCycleEndDay: number;
  /** Range last defined via settings ('YYYY-MM-DD', inclusive); anchors cycles when no budgets exist yet. */
  definedCycleStart: string | null;
  definedCycleEnd: string | null;
  createdAt: Date;
};

export const assertValidBudgetCycleEndDay = (day: number): void => {
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new Error("budgetCycleEndDay must be an integer between 1 and 31");
  }
};
