import type { Account } from "../../accounts/domain/account";
import type { TransactionRepository } from "../domain/transaction-repository";

type Dependencies = {
  transactionRepository: TransactionRepository;
};

type DeleteTransactionInput = {
  familyId: string;
  id: string;
};

export const deleteTransaction = async (
  { transactionRepository }: Dependencies,
  { familyId, id }: DeleteTransactionInput,
): Promise<{ account: Account }> => {
  const existing = await transactionRepository.findById(familyId, id);
  if (!existing) {
    throw new Error("Transaction not found");
  }

  return transactionRepository.delete(familyId, id, existing);
};
