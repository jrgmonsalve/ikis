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
  withinDays?: number;
};

export const listUpcomingCommitments = async (
  { commitmentRepository }: Dependencies,
  { familyId, today = todayIsoDate(), withinDays = 7 }: ListUpcomingCommitmentsInput,
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
    if (daysUntil <= withinDays) {
      upcoming.push({
        id: commitment.id,
        name: commitment.name,
        amountLimit: commitment.amountLimit,
        period,
        dueDate,
        daysUntil,
      });
    }
  }

  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
};
