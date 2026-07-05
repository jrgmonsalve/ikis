import type { Account } from "@/features/accounts/api";
import { apiFetch } from "@/lib/api-client";

export type Transfer = {
  id: string;
  familyId: string;
  fromAccountId: string;
  toAccountId: string;
  createdByUserId: string;
  amount: number;
  description: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type NewTransfer = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string | null;
  occurredAt: string;
};

export type TransferChanges = Partial<NewTransfer>;

export function getTransfers(): Promise<Transfer[]> {
  return apiFetch<Transfer[]>("/transfers");
}

export function createTransfer(
  input: NewTransfer,
): Promise<{ transfer: Transfer; fromAccount: Account; toAccount: Account }> {
  return apiFetch("/transfers", { method: "POST", body: input });
}

export function updateTransfer(
  id: string,
  changes: TransferChanges,
): Promise<{ transfer: Transfer; accounts: Account[] }> {
  return apiFetch(`/transfers/${id}`, { method: "PATCH", body: changes });
}

export function deleteTransfer(id: string): Promise<{ fromAccount: Account; toAccount: Account }> {
  return apiFetch(`/transfers/${id}`, { method: "DELETE" });
}
