import { apiFetch } from "@/lib/api-client";

export type AccountType = "checking" | "savings" | "credit_card" | "cash" | "digital_wallet";

export type Account = {
  id: string;
  familyId: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  archivedAt: string | null;
  createdAt: string;
};

export type NewAccount = {
  name: string;
  type: AccountType;
  currency?: string;
};

export type AccountChanges = Partial<{
  name: string;
  type: AccountType;
  archived: boolean;
}>;

export function getAccounts(): Promise<Account[]> {
  return apiFetch<Account[]>("/accounts");
}

export function createAccount(input: NewAccount): Promise<Account> {
  return apiFetch<Account>("/accounts", { method: "POST", body: input });
}

export function updateAccount(id: string, changes: AccountChanges): Promise<Account> {
  return apiFetch<Account>(`/accounts/${id}`, { method: "PATCH", body: changes });
}

export function deleteAccount(id: string): Promise<void> {
  return apiFetch<void>(`/accounts/${id}`, { method: "DELETE" });
}
