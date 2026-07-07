import type { TransactionRepository } from "../../transactions/domain/transaction-repository";
import type { TransferRepository } from "../../transfers/domain/transfer-repository";
import type { AccountRepository } from "../domain/account-repository";

type Dependencies = {
  accountRepository: AccountRepository;
  transactionRepository: TransactionRepository;
  transferRepository: TransferRepository;
};

type DeleteAccountInput = {
  familyId: string;
  id: string;
};

export const deleteAccount = async (
  { accountRepository, transactionRepository, transferRepository }: Dependencies,
  { familyId, id }: DeleteAccountInput,
): Promise<void> => {
  const existing = await accountRepository.findById(familyId, id);
  if (!existing) {
    throw new Error("Account not found");
  }

  const hasMovements =
    (await transactionRepository.existsForAccount(familyId, id)) ||
    (await transferRepository.existsForAccount(familyId, id));
  if (hasMovements) {
    throw new Error("Account has movements; archive it instead");
  }

  await accountRepository.delete(familyId, id);
};
