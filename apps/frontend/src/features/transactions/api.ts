import type { Account } from "@/features/accounts/api";
import { apiFetch } from "@/lib/api-client";

export type Transaction = {
  id: string;
  familyId: string;
  accountId: string;
  categoryId: string | null;
  createdByUserId: string;
  amount: number;
  description: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type NewTransaction = {
  accountId: string;
  categoryId: string | null;
  amount: number;
  description: string | null;
  occurredAt: string;
};

export type TransactionChanges = Partial<NewTransaction>;

export function getTransactions(): Promise<Transaction[]> {
  return apiFetch<Transaction[]>("/transactions");
}

export function createTransaction(
  input: NewTransaction,
): Promise<{ transaction: Transaction; account: Account }> {
  return apiFetch("/transactions", { method: "POST", body: input });
}

export function updateTransaction(
  id: string,
  changes: TransactionChanges,
): Promise<{ transaction: Transaction; accounts: Account[] }> {
  return apiFetch(`/transactions/${id}`, { method: "PATCH", body: changes });
}

export function deleteTransaction(id: string): Promise<{ account: Account }> {
  return apiFetch(`/transactions/${id}`, { method: "DELETE" });
}
