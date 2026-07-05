import { and, eq, isNull, sql } from "drizzle-orm";
import type { Account } from "../../../accounts/domain/account";
import { accounts } from "../../../accounts/infrastructure/persistence/accounts.schema";
import type { Db } from "../../../../shared/db";
import type { Transfer } from "../../domain/transfer";
import type { NewTransfer, TransferChanges, TransferRepository } from "../../domain/transfer-repository";
import { transfers } from "./transfers.schema";

export class DrizzleTransferRepository implements TransferRepository {
  constructor(private readonly db: Db) {}

  async findById(familyId: string, id: string): Promise<Transfer | null> {
    const [row] = await this.db
      .select()
      .from(transfers)
      .where(and(eq(transfers.familyId, familyId), eq(transfers.id, id), isNull(transfers.deletedAt)))
      .limit(1);
    return row ?? null;
  }

  async findAllByFamily(familyId: string): Promise<Transfer[]> {
    return this.db
      .select()
      .from(transfers)
      .where(and(eq(transfers.familyId, familyId), isNull(transfers.deletedAt)));
  }

  async create(input: NewTransfer): Promise<{ transfer: Transfer; fromAccount: Account; toAccount: Account }> {
    const now = new Date();
    const transfer: Transfer = {
      id: crypto.randomUUID(),
      familyId: input.familyId,
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      createdByUserId: input.createdByUserId,
      amount: input.amount,
      description: input.description,
      occurredAt: input.occurredAt,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const [, fromRows, toRows] = await this.db.batch([
      this.db.insert(transfers).values(transfer),
      this.db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${input.amount}` })
        .where(and(eq(accounts.id, input.fromAccountId), eq(accounts.familyId, input.familyId)))
        .returning(),
      this.db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${input.amount}` })
        .where(and(eq(accounts.id, input.toAccountId), eq(accounts.familyId, input.familyId)))
        .returning(),
    ]);

    const fromAccount = (fromRows as Account[])[0];
    const toAccount = (toRows as Account[])[0];
    if (!fromAccount || !toAccount) {
      throw new Error("Account not found");
    }

    return { transfer, fromAccount, toAccount };
  }

  async update(
    familyId: string,
    id: string,
    previous: Transfer,
    changes: TransferChanges,
  ): Promise<{ transfer: Transfer; accounts: Account[] }> {
    const merged = {
      fromAccountId: changes.fromAccountId ?? previous.fromAccountId,
      toAccountId: changes.toAccountId ?? previous.toAccountId,
      amount: changes.amount ?? previous.amount,
      description: changes.description !== undefined ? changes.description : previous.description,
      occurredAt: changes.occurredAt ?? previous.occurredAt,
    };
    const now = new Date();

    // Always revert the previous effect on the old accounts, then apply the new
    // effect on the (possibly different) accounts — simpler and just as correct
    // as branching on whether the accounts happened to stay the same.
    const [, revertFromRows, revertToRows, applyFromRows, applyToRows] = await this.db.batch([
      this.db
        .update(transfers)
        .set({ ...merged, updatedAt: now })
        .where(and(eq(transfers.familyId, familyId), eq(transfers.id, id))),
      this.db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${previous.amount}` })
        .where(and(eq(accounts.id, previous.fromAccountId), eq(accounts.familyId, familyId)))
        .returning(),
      this.db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${previous.amount}` })
        .where(and(eq(accounts.id, previous.toAccountId), eq(accounts.familyId, familyId)))
        .returning(),
      this.db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${merged.amount}` })
        .where(and(eq(accounts.id, merged.fromAccountId), eq(accounts.familyId, familyId)))
        .returning(),
      this.db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${merged.amount}` })
        .where(and(eq(accounts.id, merged.toAccountId), eq(accounts.familyId, familyId)))
        .returning(),
    ]);

    // The same account can appear more than once (e.g. the account didn't change) —
    // keep only the last, final value for each account id.
    const accountsById = new Map<string, Account>();
    for (const row of [
      ...(revertFromRows as Account[]),
      ...(revertToRows as Account[]),
      ...(applyFromRows as Account[]),
      ...(applyToRows as Account[]),
    ]) {
      accountsById.set(row.id, row);
    }

    const transfer: Transfer = { ...previous, ...merged, updatedAt: now };
    return { transfer, accounts: [...accountsById.values()] };
  }

  async delete(familyId: string, id: string, previous: Transfer): Promise<{ fromAccount: Account; toAccount: Account }> {
    const now = new Date();

    const [, fromRows, toRows] = await this.db.batch([
      this.db
        .update(transfers)
        .set({ deletedAt: now, updatedAt: now })
        .where(and(eq(transfers.familyId, familyId), eq(transfers.id, id))),
      this.db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${previous.amount}` })
        .where(and(eq(accounts.id, previous.fromAccountId), eq(accounts.familyId, familyId)))
        .returning(),
      this.db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${previous.amount}` })
        .where(and(eq(accounts.id, previous.toAccountId), eq(accounts.familyId, familyId)))
        .returning(),
    ]);

    const fromAccount = (fromRows as Account[])[0];
    const toAccount = (toRows as Account[])[0];
    if (!fromAccount || !toAccount) {
      throw new Error("Account not found");
    }

    return { fromAccount, toAccount };
  }
}
