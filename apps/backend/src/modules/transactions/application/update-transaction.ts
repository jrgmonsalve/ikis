import type { Account } from "../../accounts/domain/account";
import type { AccountRepository } from "../../accounts/domain/account-repository";
import type { CategoryRepository } from "../../categories/domain/category-repository";
import { assertCategoryMatchesAmount, assertValidAmount } from "../domain/transaction";
import type { Transaction } from "../domain/transaction";
import type { TransactionChanges, TransactionRepository } from "../domain/transaction-repository";

type Dependencies = {
  transactionRepository: TransactionRepository;
  accountRepository: AccountRepository;
  categoryRepository: CategoryRepository;
};

type UpdateTransactionInput = {
  familyId: string;
  id: string;
  changes: TransactionChanges;
};

export const updateTransaction = async (
  { transactionRepository, accountRepository, categoryRepository }: Dependencies,
  { familyId, id, changes }: UpdateTransactionInput,
): Promise<{ transaction: Transaction; accounts: Account[] }> => {
  const existing = await transactionRepository.findById(familyId, id);
  if (!existing) {
    throw new Error("Transaction not found");
  }

  const amount = changes.amount ?? existing.amount;
  const categoryId = changes.categoryId !== undefined ? changes.categoryId : existing.categoryId;
  assertValidAmount(amount);
  assertCategoryMatchesAmount(amount, categoryId);

  if (changes.accountId) {
    const account = await accountRepository.findById(familyId, changes.accountId);
    if (!account) {
      throw new Error("Account not found");
    }
  }

  if (changes.categoryId) {
    const category = await categoryRepository.findById(familyId, changes.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
  }

  return transactionRepository.update(familyId, id, existing, changes);
};
