import type { Account } from "../../accounts/domain/account";
import type { Transfer } from "./transfer";

export type NewTransfer = {
  familyId: string;
  fromAccountId: string;
  toAccountId: string;
  createdByUserId: string;
  amount: number;
  description: string | null;
  occurredAt: string;
};

export type TransferChanges = Partial<{
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string | null;
  occurredAt: string;
}>;

export interface TransferRepository {
  findById(familyId: string, id: string): Promise<Transfer | null>;
  findAllByFamily(familyId: string): Promise<Transfer[]>;
  create(input: NewTransfer): Promise<{ transfer: Transfer; fromAccount: Account; toAccount: Account }>;
  update(
    familyId: string,
    id: string,
    previous: Transfer,
    changes: TransferChanges,
  ): Promise<{ transfer: Transfer; accounts: Account[] }>;
  delete(familyId: string, id: string, previous: Transfer): Promise<{ fromAccount: Account; toAccount: Account }>;
}
