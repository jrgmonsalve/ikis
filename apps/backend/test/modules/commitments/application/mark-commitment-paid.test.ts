import { describe, expect, it } from "vitest";
import { markCommitmentPaid } from "../../../../src/modules/commitments/application/mark-commitment-paid";
import { unmarkCommitmentPaid } from "../../../../src/modules/commitments/application/unmark-commitment-paid";
import { InMemoryCommitmentRepository } from "../in-memory-commitment-repository";

describe("markCommitmentPaid", () => {
  it("marks a commitment as paid for a period", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();
    const commitment = await commitmentRepository.create({ familyId: "family-1", name: "Arriendo", amountLimit: 800000, dueDay: 5 });

    const payment = await markCommitmentPaid({ commitmentRepository }, { familyId: "family-1", commitmentId: commitment.id, period: "2026-09" });

    expect(payment.period).toBe("2026-09");
    expect(await commitmentRepository.findPayment("family-1", commitment.id, "2026-09")).not.toBeNull();
  });

  it("is idempotent when called twice for the same period", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();
    const commitment = await commitmentRepository.create({ familyId: "family-1", name: "Arriendo", amountLimit: 800000, dueDay: 5 });

    await markCommitmentPaid({ commitmentRepository }, { familyId: "family-1", commitmentId: commitment.id, period: "2026-09" });
    await markCommitmentPaid({ commitmentRepository }, { familyId: "family-1", commitmentId: commitment.id, period: "2026-09" });

    expect(commitmentRepository.payments).toHaveLength(1);
  });

  it("throws when the commitment does not exist", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();

    await expect(
      markCommitmentPaid({ commitmentRepository }, { familyId: "family-1", commitmentId: "ghost", period: "2026-09" }),
    ).rejects.toThrow("Commitment not found");
  });

  it("rejects an invalid period", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();
    const commitment = await commitmentRepository.create({ familyId: "family-1", name: "Arriendo", amountLimit: 800000, dueDay: 5 });

    await expect(
      markCommitmentPaid({ commitmentRepository }, { familyId: "family-1", commitmentId: commitment.id, period: "2026-9" }),
    ).rejects.toThrow("period must be in 'YYYY-MM' format");
  });
});

describe("unmarkCommitmentPaid", () => {
  it("removes a payment", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();
    const commitment = await commitmentRepository.create({ familyId: "family-1", name: "Arriendo", amountLimit: 800000, dueDay: 5 });
    await commitmentRepository.markPaid("family-1", commitment.id, "2026-09");

    await unmarkCommitmentPaid({ commitmentRepository }, { familyId: "family-1", commitmentId: commitment.id, period: "2026-09" });

    expect(await commitmentRepository.findPayment("family-1", commitment.id, "2026-09")).toBeNull();
  });

  it("throws when the commitment does not exist", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();

    await expect(
      unmarkCommitmentPaid({ commitmentRepository }, { familyId: "family-1", commitmentId: "ghost", period: "2026-09" }),
    ).rejects.toThrow("Commitment not found");
  });
});
