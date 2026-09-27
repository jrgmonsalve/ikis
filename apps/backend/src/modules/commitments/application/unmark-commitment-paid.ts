import { assertValidPeriod } from "../domain/commitment";
import type { CommitmentRepository } from "../domain/commitment-repository";

type Dependencies = {
  commitmentRepository: CommitmentRepository;
};

type UnmarkCommitmentPaidInput = {
  familyId: string;
  commitmentId: string;
  period: string;
};

export const unmarkCommitmentPaid = async (
  { commitmentRepository }: Dependencies,
  { familyId, commitmentId, period }: UnmarkCommitmentPaidInput,
): Promise<void> => {
  assertValidPeriod(period);

  const commitment = await commitmentRepository.findById(familyId, commitmentId);
  if (!commitment) {
    throw new Error("Commitment not found");
  }

  await commitmentRepository.unmarkPaid(familyId, commitmentId, period);
};
