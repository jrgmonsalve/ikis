import type { AccountRepository } from "../../accounts/domain/account-repository";
import type { CategoryRepository } from "../../categories/domain/category-repository";
import { assertValidAmountLimit, assertValidDueDay, assertValidNotifyDaysBefore } from "../domain/commitment";
import type { Commitment } from "../domain/commitment";
import type { CommitmentChanges, CommitmentRepository } from "../domain/commitment-repository";

type Dependencies = {
  commitmentRepository: CommitmentRepository;
  accountRepository: AccountRepository;
  categoryRepository: CategoryRepository;
};

type UpdateCommitmentInput = {
  familyId: string;
  id: string;
  changes: CommitmentChanges;
};

export const updateCommitment = async (
  { commitmentRepository, accountRepository, categoryRepository }: Dependencies,
  { familyId, id, changes }: UpdateCommitmentInput,
): Promise<Commitment> => {
  const existing = await commitmentRepository.findById(familyId, id);
  if (!existing) {
    throw new Error("Commitment not found");
  }

  if (changes.amountLimit !== undefined) {
    assertValidAmountLimit(changes.amountLimit);
  }
  if (changes.dueDay !== undefined) {
    assertValidDueDay(changes.dueDay);
  }
  if (changes.notifyDaysBefore !== undefined) {
    assertValidNotifyDaysBefore(changes.notifyDaysBefore);
  }
  if (changes.accountId !== undefined) {
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

  return commitmentRepository.update(familyId, id, changes);
};
