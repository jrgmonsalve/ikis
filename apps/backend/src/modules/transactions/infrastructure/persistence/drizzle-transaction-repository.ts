import { and, eq, isNull, sql } from "drizzle-orm";
import type { Account } from "../../../accounts/domain/account";
import { accounts } from "../../../accounts/infrastructure/persistence/accounts.schema";
import type { Db } from "../../../../shared/db";
import type { Transaction } from "../../domain/transaction";
import type { NewTransaction, TransactionChanges, TransactionRepository } from "../../domain/transaction-repository";
import { transactions } from "./transactions.schema";

export class DrizzleTransactionRepository implements TransactionRepository {
  constructor(private readonly db: Db) {}

  async findById(familyId: string, id: string): Promise<Transaction | null> {
    const [row] = await this.db
      .select()
      .from(transactions)
      .where(and(eq(transactions.familyId, familyId), eq(transactions.id, id), isNull(transactions.deletedAt)))
      .limit(1);
    return row ?? null;
  }

  async findAllByFamily(familyId: string): Promise<Transaction[]> {
    return this.db
      .select()
      .from(transactions)
      .where(and(eq(transactions.familyId, familyId), isNull(transactions.deletedAt)));
  }

  async create(input: NewTransaction): Promise<{ transaction: Transaction; account: Account }> {
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

    const [, accountRows] = await this.db.batch([
      this.db.insert(transactions).values(transaction),
      this.db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${input.amount}` })
        .where(and(eq(accounts.id, input.accountId), eq(accounts.familyId, input.familyId)))
        .returning(),
    ]);

    const account = (accountRows as Account[])[0];
    if (!account) {
      throw new Error("Account not found");
    }

    return { transaction, account };
  }

  async update(
    familyId: string,
    id: string,
    previous: Transaction,
    changes: TransactionChanges,
  ): Promise<{ transaction: Transaction; accounts: Account[] }> {
    const merged = {
      accountId: changes.accountId ?? previous.accountId,
      categoryId: changes.categoryId !== undefined ? changes.categoryId : previous.categoryId,
      amount: changes.amount ?? previous.amount,
      description: changes.description !== undefined ? changes.description : previous.description,
      occurredAt: changes.occurredAt ?? previous.occurredAt,
    };
    const now = new Date();

    const updateTransactionStatement = this.db
      .update(transactions)
      .set({ ...merged, updatedAt: now })
      .where(and(eq(transactions.familyId, familyId), eq(transactions.id, id)));

    let accountRows: Account[];

    if (merged.accountId === previous.accountId) {
      const delta = merged.amount - previous.amount;
      const [, updatedAccountRows] = await this.db.batch([
        updateTransactionStatement,
        this.db
          .update(accounts)
          .set({ balance: sql`${accounts.balance} + ${delta}` })
          .where(and(eq(accounts.id, previous.accountId), eq(accounts.familyId, familyId)))
          .returning(),
      ]);
      accountRows = updatedAccountRows as Account[];
    } else {
      const [, revertedAccountRows, appliedAccountRows] = await this.db.batch([
        updateTransactionStatement,
        this.db
          .update(accounts)
          .set({ balance: sql`${accounts.balance} - ${previous.amount}` })
          .where(and(eq(accounts.id, previous.accountId), eq(accounts.familyId, familyId)))
          .returning(),
        this.db
          .update(accounts)
          .set({ balance: sql`${accounts.balance} + ${merged.amount}` })
          .where(and(eq(accounts.id, merged.accountId), eq(accounts.familyId, familyId)))
          .returning(),
      ]);
      accountRows = [...(revertedAccountRows as Account[]), ...(appliedAccountRows as Account[])];
    }

    const transaction: Transaction = { ...previous, ...merged, updatedAt: now };
    return { transaction, accounts: accountRows };
  }

  async delete(familyId: string, id: string, previous: Transaction): Promise<{ account: Account }> {
    const now = new Date();

    const [, accountRows] = await this.db.batch([
      this.db
        .update(transactions)
        .set({ deletedAt: now, updatedAt: now })
        .where(and(eq(transactions.familyId, familyId), eq(transactions.id, id))),
      this.db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${previous.amount}` })
        .where(and(eq(accounts.id, previous.accountId), eq(accounts.familyId, familyId)))
        .returning(),
    ]);

    const account = (accountRows as Account[])[0];
    if (!account) {
      throw new Error("Account not found");
    }

    return { account };
  }
}
