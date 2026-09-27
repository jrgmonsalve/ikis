import type { AccountRepository } from "../../accounts/domain/account-repository";
import type { BudgetRepository } from "../../budgets/domain/budget-repository";
import type { CategoryRepository } from "../../categories/domain/category-repository";
import type { FamilyRepository } from "../../families/domain/family-repository";
import { createTransaction } from "../../transactions/application/create-transaction";
import type { TransactionRepository } from "../../transactions/domain/transaction-repository";
import { assertValidPeriod, dueDateForPeriod } from "../domain/commitment";
import type { CommitmentPayment, CommitmentRepository } from "../domain/commitment-repository";

type Dependencies = {
  commitmentRepository: CommitmentRepository;
  transactionRepository: TransactionRepository;
  accountRepository: AccountRepository;
  categoryRepository: CategoryRepository;
  budgetRepository: BudgetRepository;
  familyRepository: FamilyRepository;
};

type MarkCommitmentPaidInput = {
  familyId: string;
  userId: string;
  commitmentId: string;
  period: string;
};

export const markCommitmentPaid = async (
  { commitmentRepository, transactionRepository, accountRepository, categoryRepository, budgetRepository, familyRepository }: Dependencies,
  { familyId, userId, commitmentId, period }: MarkCommitmentPaidInput,
): Promise<CommitmentPayment> => {
  assertValidPeriod(period);

  const commitment = await commitmentRepository.findById(familyId, commitmentId);
  if (!commitment) {
    throw new Error("Commitment not found");
  }

  const existing = await commitmentRepository.findPayment(familyId, commitmentId, period);
  if (existing) {
    return existing;
  }

  const { transaction } = await createTransaction(
    { transactionRepository, accountRepository, categoryRepository, budgetRepository, familyRepository },
    {
      familyId,
      accountId: commitment.accountId,
      categoryId: commitment.categoryId,
      createdByUserId: userId,
      amount: -commitment.amountLimit,
      description: commitment.name,
      occurredAt: dueDateForPeriod(commitment.dueDay, period),
    },
  );

  return commitmentRepository.markPaid(familyId, commitmentId, period, transaction.id);
};
