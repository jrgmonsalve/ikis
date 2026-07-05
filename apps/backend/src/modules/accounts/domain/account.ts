export type AccountType = "checking" | "savings" | "credit_card" | "cash";

export type Account = {
  id: string;
  familyId: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  createdAt: Date;
};
