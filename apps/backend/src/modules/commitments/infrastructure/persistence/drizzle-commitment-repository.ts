import { and, eq } from "drizzle-orm";
import type { Db } from "../../../../shared/db";
import type { Commitment } from "../../domain/commitment";
import type { CommitmentChanges, CommitmentPayment, CommitmentRepository, NewCommitment } from "../../domain/commitment-repository";
import { commitmentPayments } from "./commitment-payments.schema";
import { commitments } from "./commitments.schema";

export class DrizzleCommitmentRepository implements CommitmentRepository {
  constructor(private readonly db: Db) {}

  async findById(familyId: string, id: string): Promise<Commitment | null> {
    const [row] = await this.db
      .select()
      .from(commitments)
      .where(and(eq(commitments.familyId, familyId), eq(commitments.id, id)))
      .limit(1);
    return row ?? null;
  }

  async findAllByFamily(familyId: string): Promise<Commitment[]> {
    return this.db.select().from(commitments).where(eq(commitments.familyId, familyId));
  }

  async create(input: NewCommitment): Promise<Commitment> {
    const row: Commitment = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      archivedAt: null,
      notifyDaysBefore: 3,
      familyId: input.familyId,
      name: input.name,
      amountLimit: input.amountLimit,
      dueDay: input.dueDay,
      ...(input.notifyDaysBefore !== undefined ? { notifyDaysBefore: input.notifyDaysBefore } : {}),
    };

    await this.db.insert(commitments).values(row);

    return row;
  }

  async update(familyId: string, id: string, changes: CommitmentChanges): Promise<Commitment> {
    await this.db
      .update(commitments)
      .set(changes)
      .where(and(eq(commitments.familyId, familyId), eq(commitments.id, id)));

    const updated = await this.findById(familyId, id);
    if (!updated) {
      throw new Error("Commitment not found");
    }

    return updated;
  }

  async findPayment(familyId: string, commitmentId: string, period: string): Promise<CommitmentPayment | null> {
    const [row] = await this.db
      .select()
      .from(commitmentPayments)
      .where(
        and(
          eq(commitmentPayments.familyId, familyId),
          eq(commitmentPayments.commitmentId, commitmentId),
          eq(commitmentPayments.period, period),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async markPaid(familyId: string, commitmentId: string, period: string): Promise<CommitmentPayment> {
    const row: CommitmentPayment = {
      id: crypto.randomUUID(),
      familyId,
      commitmentId,
      period,
      paidAt: new Date(),
    };

    await this.db.insert(commitmentPayments).values(row);

    return row;
  }

  async unmarkPaid(familyId: string, commitmentId: string, period: string): Promise<void> {
    await this.db
      .delete(commitmentPayments)
      .where(
        and(
          eq(commitmentPayments.familyId, familyId),
          eq(commitmentPayments.commitmentId, commitmentId),
          eq(commitmentPayments.period, period),
        ),
      );
  }
}
