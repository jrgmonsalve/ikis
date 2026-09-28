import { daysBetween, dueDateForPeriod, startingPeriodFor } from "../domain/commitment";
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

  const withStatus = await Promise.all(
    commitments.map(async (commitment) => {
      const currentPeriod = startingPeriodFor(commitment.dueDay, commitment.createdAt, today);
      return {
        ...commitment,
        currentPeriod,
        paidThisPeriod: (await commitmentRepository.findPayment(familyId, commitment.id, currentPeriod)) !== null,
      };
    }),
  );

  return withStatus.sort(
    (a, b) =>
      daysBetween(today, dueDateForPeriod(a.dueDay, a.currentPeriod)) -
      daysBetween(today, dueDateForPeriod(b.dueDay, b.currentPeriod)),
  );
};
