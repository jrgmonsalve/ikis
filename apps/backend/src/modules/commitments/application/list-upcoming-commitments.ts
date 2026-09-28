import { daysBetween, dueDateForPeriod, nextPeriod, startingPeriodFor } from "../domain/commitment";
import type { UpcomingCommitment } from "../domain/commitment";
import type { CommitmentRepository } from "../domain/commitment-repository";

export const todayIsoDate = (): string => new Date().toISOString().slice(0, 10);

type Dependencies = {
  commitmentRepository: CommitmentRepository;
};

type ListUpcomingCommitmentsInput = {
  familyId: string;
  today?: string;
  limit?: number;
};

/** All pending/overdue commitments, most urgent first; capped to `limit` when given. No date-window filtering. */
export const listUpcomingCommitments = async (
  { commitmentRepository }: Dependencies,
  { familyId, today = todayIsoDate(), limit }: ListUpcomingCommitmentsInput,
): Promise<UpcomingCommitment[]> => {
  const commitments = (await commitmentRepository.findAllByFamily(familyId)).filter(
    (commitment) => commitment.archivedAt === null,
  );

  const upcoming: UpcomingCommitment[] = [];

  for (const commitment of commitments) {
    let period = startingPeriodFor(commitment.dueDay, commitment.createdAt, today);
    const currentPayment = await commitmentRepository.findPayment(familyId, commitment.id, period);
    if (currentPayment) {
      period = nextPeriod(period);
    }

    const dueDate = dueDateForPeriod(commitment.dueDay, period);
    const daysUntil = daysBetween(today, dueDate);
    upcoming.push({
      id: commitment.id,
      name: commitment.name,
      amountLimit: commitment.amountLimit,
      period,
      dueDate,
      daysUntil,
    });
  }

  upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  return limit === undefined ? upcoming : upcoming.slice(0, limit);
};
