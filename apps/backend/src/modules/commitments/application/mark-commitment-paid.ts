import { assertValidPeriod } from "../domain/commitment";
import type { CommitmentPayment, CommitmentRepository } from "../domain/commitment-repository";

type Dependencies = {
  commitmentRepository: CommitmentRepository;
};

type MarkCommitmentPaidInput = {
  familyId: string;
  commitmentId: string;
  period: string;
};

export const markCommitmentPaid = async (
  { commitmentRepository }: Dependencies,
  { familyId, commitmentId, period }: MarkCommitmentPaidInput,
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

  return commitmentRepository.markPaid(familyId, commitmentId, period);
};
