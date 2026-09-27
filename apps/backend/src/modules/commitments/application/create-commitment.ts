import type { AccountRepository } from "../../accounts/domain/account-repository";
import type { CategoryRepository } from "../../categories/domain/category-repository";
import { assertValidAmountLimit, assertValidDueDay, assertValidNotifyDaysBefore } from "../domain/commitment";
import type { Commitment } from "../domain/commitment";
import type { CommitmentRepository, NewCommitment } from "../domain/commitment-repository";

type Dependencies = {
  commitmentRepository: CommitmentRepository;
  accountRepository: AccountRepository;
  categoryRepository: CategoryRepository;
};

export const createCommitment = async (
  { commitmentRepository, accountRepository, categoryRepository }: Dependencies,
  input: NewCommitment,
): Promise<Commitment> => {
  assertValidAmountLimit(input.amountLimit);
  assertValidDueDay(input.dueDay);
  if (input.notifyDaysBefore !== undefined) {
    assertValidNotifyDaysBefore(input.notifyDaysBefore);
  }

  const account = await accountRepository.findById(input.familyId, input.accountId);
  if (!account) {
    throw new Error("Account not found");
  }

  if (input.categoryId) {
    const category = await categoryRepository.findById(input.familyId, input.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
  }

  return commitmentRepository.create(input);
};
