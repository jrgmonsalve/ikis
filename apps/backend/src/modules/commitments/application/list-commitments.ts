import { periodOf } from "../domain/commitment";
import type { CommitmentWithPaymentStatus } from "../domain/commitment";
import type { CommitmentRepository } from "../domain/commitment-repository";
import { todayIsoDate } from "./list-upcoming-commitments";

type Dependencies = {
  commitmentRepository: CommitmentRepository;
};

type ListCommitmentsInput = {
  familyId: string;
  today?: string;
};

export const listCommitments = async (
  { commitmentRepository }: Dependencies,
  { familyId, today = todayIsoDate() }: ListCommitmentsInput,
): Promise<CommitmentWithPaymentStatus[]> => {
  const commitments = await commitmentRepository.findAllByFamily(familyId);
  const currentPeriod = periodOf(today);

  return Promise.all(
    commitments.map(async (commitment) => ({
      ...commitment,
      currentPeriod,
      paidThisPeriod: (await commitmentRepository.findPayment(familyId, commitment.id, currentPeriod)) !== null,
    })),
  );
};
