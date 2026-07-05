import type { Transaction } from "../domain/transaction";
import type { TransactionRepository } from "../domain/transaction-repository";

type Dependencies = {
  transactionRepository: TransactionRepository;
};

export const listTransactions = async (
  { transactionRepository }: Dependencies,
  { familyId }: { familyId: string },
): Promise<Transaction[]> => {
  return transactionRepository.findAllByFamily(familyId);
};
