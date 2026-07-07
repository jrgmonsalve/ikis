import type { Account } from "../../../src/modules/accounts/domain/account";
import type { Transaction } from "../../../src/modules/transactions/domain/transaction";
import type {
  NewTransaction,
  TransactionChanges,
  TransactionRepository,
} from "../../../src/modules/transactions/domain/transaction-repository";
import type { InMemoryAccountRepository } from "../accounts/in-memory-account-repository";

export class InMemoryTransactionRepository implements TransactionRepository {
  transactions: Transaction[] = [];

  constructor(private readonly accountRepository: InMemoryAccountRepository) {}

  async findById(familyId: string, id: string) {
    return (
      this.transactions.find(
        (transaction) => transaction.familyId === familyId && transaction.id === id && transaction.deletedAt === null,
      ) ?? null
    );
  }

  async findAllByFamily(familyId: string) {
    return this.transactions.filter(
      (transaction) => transaction.familyId === familyId && transaction.deletedAt === null,
    );
  }

  private findAccountOrThrow(familyId: string, accountId: string): Account {
    const account = this.accountRepository.accounts.find(
      (candidate) => candidate.familyId === familyId && candidate.id === accountId,
    );
    if (!account) {
      throw new Error("Account not found");
    }
    return account;
  }

  async create(input: NewTransaction) {
    const now = new Date();
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      familyId: input.familyId,
      accountId: input.accountId,
      categoryId: input.categoryId,
      createdByUserId: input.createdByUserId,
      amount: input.amount,
      description: input.description,
      occurredAt: input.occurredAt,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    this.transactions.push(transaction);

    const account = this.findAccountOrThrow(input.familyId, input.accountId);
    account.balance += input.amount;

    return { transaction, account };
  }

  async update(familyId: string, id: string, previous: Transaction, changes: TransactionChanges) {
    const merged = {
      accountId: changes.accountId ?? previous.accountId,
      categoryId: changes.categoryId !== undefined ? changes.categoryId : previous.categoryId,
      amount: changes.amount ?? previous.amount,
      description: changes.description !== undefined ? changes.description : previous.description,
      occurredAt: changes.occurredAt ?? previous.occurredAt,
    };

    const stored = this.transactions.find((transaction) => transaction.familyId === familyId && transaction.id === id);
    if (!stored) {
      throw new Error("Transaction not found");
    }

    const accountsTouched: Account[] = [];
    if (merged.accountId === previous.accountId) {
      const account = this.findAccountOrThrow(familyId, previous.accountId);
      account.balance += merged.amount - previous.amount;
      accountsTouched.push(account);
    } else {
      const previousAccount = this.findAccountOrThrow(familyId, previous.accountId);
      previousAccount.balance -= previous.amount;
      const newAccount = this.findAccountOrThrow(familyId, merged.accountId);
      newAccount.balance += merged.amount;
      accountsTouched.push(previousAccount, newAccount);
    }

    Object.assign(stored, merged, { updatedAt: new Date() });

    return { transaction: stored, accounts: accountsTouched };
  }

  async delete(familyId: string, id: string, previous: Transaction) {
    const stored = this.transactions.find((transaction) => transaction.familyId === familyId && transaction.id === id);
    if (!stored) {
      throw new Error("Transaction not found");
    }
    stored.deletedAt = new Date();

    const account = this.findAccountOrThrow(familyId, previous.accountId);
    account.balance -= previous.amount;

    return { account };
  }

  async existsForAccount(familyId: string, accountId: string) {
    return this.transactions.some(
      (transaction) =>
        transaction.familyId === familyId && transaction.accountId === accountId && transaction.deletedAt === null,
    );
  }

  async purgeDeletedForAccount(familyId: string, accountId: string) {
    this.transactions = this.transactions.filter(
      (transaction) =>
        !(transaction.familyId === familyId && transaction.accountId === accountId && transaction.deletedAt !== null),
    );
  }
}
