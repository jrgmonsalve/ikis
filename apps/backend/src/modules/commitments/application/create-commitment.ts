import { assertValidAmountLimit, assertValidDueDay, assertValidNotifyDaysBefore } from "../domain/commitment";
import type { Commitment } from "../domain/commitment";
import type { CommitmentRepository, NewCommitment } from "../domain/commitment-repository";

type Dependencies = {
  commitmentRepository: CommitmentRepository;
};

export const createCommitment = async ({ commitmentRepository }: Dependencies, input: NewCommitment): Promise<Commitment> => {
  assertValidAmountLimit(input.amountLimit);
  assertValidDueDay(input.dueDay);
  if (input.notifyDaysBefore !== undefined) {
    assertValidNotifyDaysBefore(input.notifyDaysBefore);
  }

  return commitmentRepository.create(input);
};
