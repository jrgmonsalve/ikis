import type { Account } from "../../../src/modules/accounts/domain/account";
import type { Transfer } from "../../../src/modules/transfers/domain/transfer";
import type {
  NewTransfer,
  TransferChanges,
  TransferRepository,
} from "../../../src/modules/transfers/domain/transfer-repository";
import type { InMemoryAccountRepository } from "../accounts/in-memory-account-repository";

export class InMemoryTransferRepository implements TransferRepository {
  transfers: Transfer[] = [];

  constructor(private readonly accountRepository: InMemoryAccountRepository) {}

  async findById(familyId: string, id: string) {
    return (
      this.transfers.find(
        (transfer) => transfer.familyId === familyId && transfer.id === id && transfer.deletedAt === null,
      ) ?? null
    );
  }

  async findAllByFamily(familyId: string) {
    return this.transfers.filter((transfer) => transfer.familyId === familyId && transfer.deletedAt === null);
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

  async create(input: NewTransfer) {
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
    this.transfers.push(transfer);

    const fromAccount = this.findAccountOrThrow(input.familyId, input.fromAccountId);
    fromAccount.balance -= input.amount;
    const toAccount = this.findAccountOrThrow(input.familyId, input.toAccountId);
    toAccount.balance += input.amount;

    return { transfer, fromAccount, toAccount };
  }

  async update(familyId: string, id: string, previous: Transfer, changes: TransferChanges) {
    const merged = {
      fromAccountId: changes.fromAccountId ?? previous.fromAccountId,
      toAccountId: changes.toAccountId ?? previous.toAccountId,
      amount: changes.amount ?? previous.amount,
      description: changes.description !== undefined ? changes.description : previous.description,
      occurredAt: changes.occurredAt ?? previous.occurredAt,
    };

    const stored = this.transfers.find((transfer) => transfer.familyId === familyId && transfer.id === id);
    if (!stored) {
      throw new Error("Transfer not found");
    }

    const revertFrom = this.findAccountOrThrow(familyId, previous.fromAccountId);
    revertFrom.balance += previous.amount;
    const revertTo = this.findAccountOrThrow(familyId, previous.toAccountId);
    revertTo.balance -= previous.amount;
    const applyFrom = this.findAccountOrThrow(familyId, merged.fromAccountId);
    applyFrom.balance -= merged.amount;
    const applyTo = this.findAccountOrThrow(familyId, merged.toAccountId);
    applyTo.balance += merged.amount;

    Object.assign(stored, merged, { updatedAt: new Date() });

    const accountsById = new Map<string, Account>();
    for (const account of [revertFrom, revertTo, applyFrom, applyTo]) {
      accountsById.set(account.id, account);
    }

    return { transfer: stored, accounts: [...accountsById.values()] };
  }

  async delete(familyId: string, id: string, previous: Transfer) {
    const stored = this.transfers.find((transfer) => transfer.familyId === familyId && transfer.id === id);
    if (!stored) {
      throw new Error("Transfer not found");
    }
    stored.deletedAt = new Date();

    const fromAccount = this.findAccountOrThrow(familyId, previous.fromAccountId);
    fromAccount.balance += previous.amount;
    const toAccount = this.findAccountOrThrow(familyId, previous.toAccountId);
    toAccount.balance -= previous.amount;

    return { fromAccount, toAccount };
  }

  async existsForAccount(familyId: string, accountId: string) {
    return this.transfers.some(
      (transfer) =>
        transfer.familyId === familyId &&
        (transfer.fromAccountId === accountId || transfer.toAccountId === accountId) &&
        transfer.deletedAt === null,
    );
  }

  async purgeDeletedForAccount(familyId: string, accountId: string) {
    this.transfers = this.transfers.filter(
      (transfer) =>
        !(
          transfer.familyId === familyId &&
          (transfer.fromAccountId === accountId || transfer.toAccountId === accountId) &&
          transfer.deletedAt !== null
        ),
    );
  }
}
