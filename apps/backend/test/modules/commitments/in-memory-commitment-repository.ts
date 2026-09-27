import type { Commitment } from "../../../src/modules/commitments/domain/commitment";
import type {
  CommitmentChanges,
  CommitmentPayment,
  CommitmentRepository,
  NewCommitment,
} from "../../../src/modules/commitments/domain/commitment-repository";

export class InMemoryCommitmentRepository implements CommitmentRepository {
  commitments: Commitment[] = [];
  payments: CommitmentPayment[] = [];

  async findById(familyId: string, id: string) {
    return this.commitments.find((commitment) => commitment.familyId === familyId && commitment.id === id) ?? null;
  }

  async findAllByFamily(familyId: string) {
    return this.commitments.filter((commitment) => commitment.familyId === familyId);
  }

  async create(input: NewCommitment) {
    const commitment: Commitment = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      archivedAt: null,
      notifyDaysBefore: input.notifyDaysBefore ?? 3,
      familyId: input.familyId,
      name: input.name,
      amountLimit: input.amountLimit,
      dueDay: input.dueDay,
    };
    this.commitments.push(commitment);
    return commitment;
  }

  async update(familyId: string, id: string, changes: CommitmentChanges) {
    const commitment = await this.findById(familyId, id);
    if (!commitment) {
      throw new Error("Commitment not found");
    }
    Object.assign(commitment, changes);
    return commitment;
  }

  async findPayment(familyId: string, commitmentId: string, period: string) {
    return (
      this.payments.find(
        (payment) => payment.familyId === familyId && payment.commitmentId === commitmentId && payment.period === period,
      ) ?? null
    );
  }

  async markPaid(familyId: string, commitmentId: string, period: string) {
    const payment: CommitmentPayment = { id: crypto.randomUUID(), familyId, commitmentId, period, paidAt: new Date() };
    this.payments.push(payment);
    return payment;
  }

  async unmarkPaid(familyId: string, commitmentId: string, period: string) {
    this.payments = this.payments.filter(
      (payment) => !(payment.familyId === familyId && payment.commitmentId === commitmentId && payment.period === period),
    );
  }
}
