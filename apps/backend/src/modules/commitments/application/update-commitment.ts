import { assertValidAmountLimit, assertValidDueDay, assertValidNotifyDaysBefore } from "../domain/commitment";
import type { Commitment } from "../domain/commitment";
import type { CommitmentChanges, CommitmentRepository } from "../domain/commitment-repository";

type Dependencies = {
  commitmentRepository: CommitmentRepository;
};

type UpdateCommitmentInput = {
  familyId: string;
  id: string;
  changes: CommitmentChanges;
};

export const updateCommitment = async (
  { commitmentRepository }: Dependencies,
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

  return commitmentRepository.update(familyId, id, changes);
};
