export type AccountType = "checking" | "savings" | "credit_card" | "cash" | "digital_wallet";

export type Account = {
  id: string;
  familyId: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  /** An archived account keeps its history but can't receive new movements. */
  archivedAt: Date | null;
  createdAt: Date;
};
