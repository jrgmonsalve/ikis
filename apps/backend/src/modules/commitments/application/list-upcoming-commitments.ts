import { daysBetween, dueDateForPeriod, startingPeriodFor } from "../domain/commitment";
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

/**
 * Commitments still unpaid for their current period — pending or overdue — most urgent
 * first, capped to `limit` when given. No date-window filtering. A commitment already
 * paid for its current period drops out entirely until its next period's due date
 * comes around on its own; it never gets shown early.
 */
export const listUpcomingCommitments = async (
  { commitmentRepository }: Dependencies,
  { familyId, today = todayIsoDate(), limit }: ListUpcomingCommitmentsInput,
): Promise<UpcomingCommitment[]> => {
  const commitments = (await commitmentRepository.findAllByFamily(familyId)).filter(
    (commitment) => commitment.archivedAt === null,
  );

  const upcoming: UpcomingCommitment[] = [];

  for (const commitment of commitments) {
    const period = startingPeriodFor(commitment.dueDay, commitment.createdAt, today);
    const payment = await commitmentRepository.findPayment(familyId, commitment.id, period);
    if (payment) {
      continue;
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
