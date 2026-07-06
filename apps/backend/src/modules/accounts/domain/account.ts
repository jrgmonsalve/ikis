export type AccountType = "checking" | "savings" | "credit_card" | "cash" | "digital_wallet";

export type Account = {
  id: string;
  familyId: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  createdAt: Date;
};
