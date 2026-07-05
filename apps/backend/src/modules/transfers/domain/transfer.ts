export type Transfer = {
  id: string;
  familyId: string;
  fromAccountId: string;
  toAccountId: string;
  createdByUserId: string;
  /** Minor currency units. Always positive — direction comes from fromAccountId/toAccountId. */
  amount: number;
  description: string | null;
  /** ISO date, 'YYYY-MM-DD'. */
  occurredAt: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export const assertValidTransferAmount = (amount: number): void => {
  if (amount <= 0) {
    throw new Error("Transfer amount must be greater than zero");
  }
};

export const assertDifferentAccounts = (fromAccountId: string, toAccountId: string): void => {
  if (fromAccountId === toAccountId) {
    throw new Error("Cannot transfer to the same account");
  }
};
