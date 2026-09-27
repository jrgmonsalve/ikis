import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { DrizzleCommitmentRepository } from "../../../../src/modules/commitments/infrastructure/persistence/drizzle-commitment-repository";
import { createDb } from "../../../../src/shared/db";

const setup = () => ({ commitmentRepository: new DrizzleCommitmentRepository(createDb(env.DB)) });

describe("DrizzleCommitmentRepository", () => {
  it("creates a commitment and finds it by id", async () => {
    const { commitmentRepository } = setup();
    const familyId = crypto.randomUUID();

    const commitment = await commitmentRepository.create({ familyId, name: "Arriendo", amountLimit: 800000, dueDay: 5 });

    expect(await commitmentRepository.findById(familyId, commitment.id)).toEqual(commitment);
    expect(commitment.notifyDaysBefore).toBe(3);
  });

  it("lists all commitments for a family", async () => {
    const { commitmentRepository } = setup();
    const familyId = crypto.randomUUID();
    await commitmentRepository.create({ familyId, name: "Arriendo", amountLimit: 800000, dueDay: 5 });
    await commitmentRepository.create({ familyId, name: "Gimnasio", amountLimit: 60000, dueDay: 10 });
    await commitmentRepository.create({ familyId: crypto.randomUUID(), name: "Otra familia", amountLimit: 1, dueDay: 1 });

    expect(await commitmentRepository.findAllByFamily(familyId)).toHaveLength(2);
  });

  it("updates a commitment", async () => {
    const { commitmentRepository } = setup();
    const familyId = crypto.randomUUID();
    const commitment = await commitmentRepository.create({ familyId, name: "Arriendo", amountLimit: 800000, dueDay: 5 });

    const updated = await commitmentRepository.update(familyId, commitment.id, { amountLimit: 850000, archivedAt: new Date() });

    expect(updated.amountLimit).toBe(850000);
    expect(updated.archivedAt).not.toBeNull();
  });

  it("marks a period as paid, finds it, and unmarks it", async () => {
    const { commitmentRepository } = setup();
    const familyId = crypto.randomUUID();
    const commitment = await commitmentRepository.create({ familyId, name: "Arriendo", amountLimit: 800000, dueDay: 5 });

    expect(await commitmentRepository.findPayment(familyId, commitment.id, "2026-09")).toBeNull();

    await commitmentRepository.markPaid(familyId, commitment.id, "2026-09");
    expect(await commitmentRepository.findPayment(familyId, commitment.id, "2026-09")).not.toBeNull();

    await commitmentRepository.unmarkPaid(familyId, commitment.id, "2026-09");
    expect(await commitmentRepository.findPayment(familyId, commitment.id, "2026-09")).toBeNull();
  });

  it("rejects a duplicate payment for the same family, commitment and period", async () => {
    const { commitmentRepository } = setup();
    const familyId = crypto.randomUUID();
    const commitment = await commitmentRepository.create({ familyId, name: "Arriendo", amountLimit: 800000, dueDay: 5 });

    await commitmentRepository.markPaid(familyId, commitment.id, "2026-09");

    await expect(commitmentRepository.markPaid(familyId, commitment.id, "2026-09")).rejects.toThrow();
  });

  it("deletes payments when the commitment is deleted (cascade)", async () => {
    const { commitmentRepository } = setup();
    const db = createDb(env.DB);
    const familyId = crypto.randomUUID();
    const commitment = await commitmentRepository.create({ familyId, name: "Arriendo", amountLimit: 800000, dueDay: 5 });
    await commitmentRepository.markPaid(familyId, commitment.id, "2026-09");

    const { commitments } = await import("../../../../src/modules/commitments/infrastructure/persistence/commitments.schema");
    const { eq } = await import("drizzle-orm");
    await db.delete(commitments).where(eq(commitments.id, commitment.id));

    expect(await commitmentRepository.findPayment(familyId, commitment.id, "2026-09")).toBeNull();
  });
});
