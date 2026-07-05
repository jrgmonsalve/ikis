import type { Account } from "../../accounts/domain/account";
import type { AccountRepository } from "../../accounts/domain/account-repository";
import { assertDifferentAccounts, assertValidTransferAmount } from "../domain/transfer";
import type { Transfer } from "../domain/transfer";
import type { NewTransfer, TransferRepository } from "../domain/transfer-repository";

type Dependencies = {
  transferRepository: TransferRepository;
  accountRepository: AccountRepository;
};

export const createTransfer = async (
  { transferRepository, accountRepository }: Dependencies,
  input: NewTransfer,
): Promise<{ transfer: Transfer; fromAccount: Account; toAccount: Account }> => {
  assertValidTransferAmount(input.amount);
  assertDifferentAccounts(input.fromAccountId, input.toAccountId);

  const fromAccount = await accountRepository.findById(input.familyId, input.fromAccountId);
  if (!fromAccount) {
    throw new Error("Account not found");
  }

  const toAccount = await accountRepository.findById(input.familyId, input.toAccountId);
  if (!toAccount) {
    throw new Error("Account not found");
  }

  return transferRepository.create(input);
};
