import { describe, expect, it } from "vitest";
import { createCommitment } from "../../../../src/modules/commitments/application/create-commitment";
import { InMemoryCommitmentRepository } from "../in-memory-commitment-repository";

describe("createCommitment", () => {
  it("creates a commitment with default notifyDaysBefore", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();

    const commitment = await createCommitment(
      { commitmentRepository },
      { familyId: "family-1", name: "Arriendo", amountLimit: 800000, dueDay: 5 },
    );

    expect(commitment.notifyDaysBefore).toBe(3);
    expect(commitment.archivedAt).toBeNull();
  });

  it("rejects an invalid amountLimit", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();

    await expect(
      createCommitment({ commitmentRepository }, { familyId: "family-1", name: "Arriendo", amountLimit: 0, dueDay: 5 }),
    ).rejects.toThrow("amountLimit must be greater than zero");
  });

  it("rejects an invalid dueDay", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();

    await expect(
      createCommitment({ commitmentRepository }, { familyId: "family-1", name: "Arriendo", amountLimit: 800000, dueDay: 32 }),
    ).rejects.toThrow("dueDay must be an integer between 1 and 31");
  });
});
