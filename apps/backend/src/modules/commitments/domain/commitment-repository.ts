import type { Commitment } from "./commitment";

export type NewCommitment = {
  familyId: string;
  name: string;
  amountLimit: number;
  dueDay: number;
  notifyDaysBefore?: number;
};

export type CommitmentChanges = {
  name?: string;
  amountLimit?: number;
  dueDay?: number;
  notifyDaysBefore?: number;
  archivedAt?: Date | null;
};

export type CommitmentPayment = {
  id: string;
  familyId: string;
  commitmentId: string;
  period: string;
  paidAt: Date;
};

export interface CommitmentRepository {
  findById(familyId: string, id: string): Promise<Commitment | null>;
  findAllByFamily(familyId: string): Promise<Commitment[]>;
  create(input: NewCommitment): Promise<Commitment>;
  update(familyId: string, id: string, changes: CommitmentChanges): Promise<Commitment>;
  findPayment(familyId: string, commitmentId: string, period: string): Promise<CommitmentPayment | null>;
  markPaid(familyId: string, commitmentId: string, period: string): Promise<CommitmentPayment>;
  unmarkPaid(familyId: string, commitmentId: string, period: string): Promise<void>;
}
