export type Transaction = {
  id: string;
  familyId: string;
  accountId: string;
  categoryId: string | null;
  createdByUserId: string;
  /** Minor currency units. Negative = expense, positive = income. */
  amount: number;
  description: string | null;
  /** ISO date, 'YYYY-MM-DD'. */
  occurredAt: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export const assertValidAmount = (amount: number): void => {
  if (amount === 0) {
    throw new Error("Amount cannot be zero");
  }
};

export const assertCategoryMatchesAmount = (amount: number, categoryId: string | null): void => {
  if (amount > 0 && categoryId !== null) {
    throw new Error("Income transactions cannot have a category");
  }
};
