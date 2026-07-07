import type { Account } from "../../../src/modules/accounts/domain/account";
import type { AccountChanges, AccountRepository, NewAccount } from "../../../src/modules/accounts/domain/account-repository";

export class InMemoryAccountRepository implements AccountRepository {
  accounts: Account[] = [];

  async findById(familyId: string, id: string) {
    return this.accounts.find((account) => account.familyId === familyId && account.id === id) ?? null;
  }

  async findAllByFamily(familyId: string) {
    return this.accounts.filter((account) => account.familyId === familyId);
  }

  async create(input: NewAccount) {
    const account: Account = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      balance: 0,
      currency: input.currency ?? "COP",
      archivedAt: null,
      familyId: input.familyId,
      name: input.name,
      type: input.type,
    };
    this.accounts.push(account);
    return account;
  }

  async update(familyId: string, id: string, changes: AccountChanges) {
    const account = await this.findById(familyId, id);
    if (!account) {
      throw new Error("Account not found");
    }
    if (changes.name !== undefined) {
      account.name = changes.name;
    }
    if (changes.type !== undefined) {
      account.type = changes.type;
    }
    if (changes.archivedAt !== undefined) {
      account.archivedAt = changes.archivedAt;
    }
    return account;
  }

  async delete(familyId: string, id: string) {
    this.accounts = this.accounts.filter((account) => !(account.familyId === familyId && account.id === id));
  }
}
