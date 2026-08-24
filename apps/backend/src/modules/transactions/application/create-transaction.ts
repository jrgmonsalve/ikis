import type { Account } from "../../accounts/domain/account";
import type { AccountRepository } from "../../accounts/domain/account-repository";
import type { BudgetRepository } from "../../budgets/domain/budget-repository";
import type { CategoryRepository } from "../../categories/domain/category-repository";
import type { FamilyRepository } from "../../families/domain/family-repository";
import { assertWithinBudget } from "./assert-within-budget";
import { assertCategoryMatchesAmount, assertValidAmount } from "../domain/transaction";
import type { Transaction } from "../domain/transaction";
import type { NewTransaction, TransactionRepository } from "../domain/transaction-repository";

type Dependencies = {
  transactionRepository: TransactionRepository;
  accountRepository: AccountRepository;
  categoryRepository: CategoryRepository;
  budgetRepository: BudgetRepository;
  familyRepository: FamilyRepository;
};

export const createTransaction = async (
  { transactionRepository, accountRepository, categoryRepository, budgetRepository, familyRepository }: Dependencies,
  input: NewTransaction,
): Promise<{ transaction: Transaction; account: Account }> => {
  assertValidAmount(input.amount);
  assertCategoryMatchesAmount(input.amount, input.categoryId);

  const account = await accountRepository.findById(input.familyId, input.accountId);
  if (!account) {
    throw new Error("Account not found");
  }
  if (account.archivedAt !== null) {
    throw new Error("Account is archived");
  }

  if (input.categoryId) {
    const category = await categoryRepository.findById(input.familyId, input.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    if (input.amount < 0) {
      await assertWithinBudget(
        { budgetRepository, familyRepository },
        { familyId: input.familyId, category, occurredAt: input.occurredAt, requestedAmount: -input.amount },
      );
    }
  }

  return transactionRepository.create(input);
};
