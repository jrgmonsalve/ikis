import type { Account } from "../../accounts/domain/account";
import type { Transaction } from "./transaction";

export type NewTransaction = {
  familyId: string;
  accountId: string;
  categoryId: string | null;
  createdByUserId: string;
  amount: number;
  description: string | null;
  occurredAt: string;
};

export type TransactionChanges = Partial<{
  accountId: string;
  categoryId: string | null;
  amount: number;
  description: string | null;
  occurredAt: string;
}>;

export interface TransactionRepository {
  findById(familyId: string, id: string): Promise<Transaction | null>;
  findAllByFamily(familyId: string): Promise<Transaction[]>;
  create(input: NewTransaction): Promise<{ transaction: Transaction; account: Account }>;
  update(
    familyId: string,
    id: string,
    previous: Transaction,
    changes: TransactionChanges,
  ): Promise<{ transaction: Transaction; accounts: Account[] }>;
  delete(familyId: string, id: string, previous: Transaction): Promise<{ account: Account }>;
  existsForAccount(familyId: string, accountId: string): Promise<boolean>;
  purgeDeletedForAccount(familyId: string, accountId: string): Promise<void>;
}
