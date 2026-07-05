import type { Account } from "../../accounts/domain/account";
import type { AccountRepository } from "../../accounts/domain/account-repository";
import { assertDifferentAccounts, assertValidTransferAmount } from "../domain/transfer";
import type { Transfer } from "../domain/transfer";
import type { TransferChanges, TransferRepository } from "../domain/transfer-repository";

type Dependencies = {
  transferRepository: TransferRepository;
  accountRepository: AccountRepository;
};

type UpdateTransferInput = {
  familyId: string;
  id: string;
  changes: TransferChanges;
};

export const updateTransfer = async (
  { transferRepository, accountRepository }: Dependencies,
  { familyId, id, changes }: UpdateTransferInput,
): Promise<{ transfer: Transfer; accounts: Account[] }> => {
  const existing = await transferRepository.findById(familyId, id);
  if (!existing) {
    throw new Error("Transfer not found");
  }

  const amount = changes.amount ?? existing.amount;
  const fromAccountId = changes.fromAccountId ?? existing.fromAccountId;
  const toAccountId = changes.toAccountId ?? existing.toAccountId;
  assertValidTransferAmount(amount);
  assertDifferentAccounts(fromAccountId, toAccountId);

  if (changes.fromAccountId) {
    const fromAccount = await accountRepository.findById(familyId, changes.fromAccountId);
    if (!fromAccount) {
      throw new Error("Account not found");
    }
  }

  if (changes.toAccountId) {
    const toAccount = await accountRepository.findById(familyId, changes.toAccountId);
    if (!toAccount) {
      throw new Error("Account not found");
    }
  }

  return transferRepository.update(familyId, id, existing, changes);
};
