import type { Account, AccountType } from "./account";

export type NewAccount = {
  familyId: string;
  name: string;
  type: AccountType;
  currency?: string;
};

export type AccountChanges = {
  name?: string;
  type?: AccountType;
};

export interface AccountRepository {
  findById(familyId: string, id: string): Promise<Account | null>;
  findAllByFamily(familyId: string): Promise<Account[]>;
  create(account: NewAccount): Promise<Account>;
  update(familyId: string, id: string, changes: AccountChanges): Promise<Account>;
}
