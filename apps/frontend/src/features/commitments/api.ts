import { apiFetch } from "@/lib/api-client";

export type Commitment = {
  id: string;
  familyId: string;
  name: string;
  amountLimit: number;
  dueDay: number;
  accountId: string;
  categoryId: string | null;
  notifyDaysBefore: number;
  archivedAt: string | null;
  createdAt: string;
};

export type UpcomingCommitment = {
  id: string;
  name: string;
  amountLimit: number;
  period: string;
  dueDate: string;
  daysUntil: number;
};

export type NewCommitment = {
  name: string;
  amountLimit: number;
  dueDay: number;
  accountId: string;
  categoryId?: string | null;
  notifyDaysBefore?: number;
};

export type CommitmentChanges = Partial<{
  name: string;
  amountLimit: number;
  dueDay: number;
  accountId: string;
  categoryId: string | null;
  notifyDaysBefore: number;
  archived: boolean;
}>;

export function getCommitments(): Promise<Commitment[]> {
  return apiFetch<Commitment[]>("/commitments");
}

export function getUpcomingCommitments(withinDays = 7): Promise<UpcomingCommitment[]> {
  return apiFetch<UpcomingCommitment[]>(`/commitments/upcoming?withinDays=${withinDays}`);
}

export function createCommitment(input: NewCommitment): Promise<Commitment> {
  return apiFetch<Commitment>("/commitments", { method: "POST", body: input });
}

export function updateCommitment(id: string, changes: CommitmentChanges): Promise<Commitment> {
  return apiFetch<Commitment>(`/commitments/${id}`, { method: "PATCH", body: changes });
}

export function markCommitmentPaid(id: string, period: string): Promise<void> {
  return apiFetch<void>(`/commitments/${id}/payments`, { method: "POST", body: { period } });
}

export function unmarkCommitmentPaid(id: string, period: string): Promise<void> {
  return apiFetch<void>(`/commitments/${id}/payments/${period}`, { method: "DELETE" });
}
