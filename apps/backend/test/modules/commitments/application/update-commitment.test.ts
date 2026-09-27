import { describe, expect, it } from "vitest";
import { updateCommitment } from "../../../../src/modules/commitments/application/update-commitment";
import { InMemoryCommitmentRepository } from "../in-memory-commitment-repository";

describe("updateCommitment", () => {
  it("updates fields on an existing commitment", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();
    const commitment = await commitmentRepository.create({ familyId: "family-1", name: "Arriendo", amountLimit: 800000, dueDay: 5 });

    const updated = await updateCommitment(
      { commitmentRepository },
      { familyId: "family-1", id: commitment.id, changes: { amountLimit: 850000 } },
    );

    expect(updated.amountLimit).toBe(850000);
  });

  it("archives a commitment via archivedAt", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();
    const commitment = await commitmentRepository.create({ familyId: "family-1", name: "Arriendo", amountLimit: 800000, dueDay: 5 });

    const archived = await updateCommitment(
      { commitmentRepository },
      { familyId: "family-1", id: commitment.id, changes: { archivedAt: new Date() } },
    );

    expect(archived.archivedAt).not.toBeNull();
  });

  it("throws when the commitment does not exist", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();

    await expect(
      updateCommitment({ commitmentRepository }, { familyId: "family-1", id: "ghost", changes: { amountLimit: 1000 } }),
    ).rejects.toThrow("Commitment not found");
  });

  it("rejects an invalid dueDay change", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();
    const commitment = await commitmentRepository.create({ familyId: "family-1", name: "Arriendo", amountLimit: 800000, dueDay: 5 });

    await expect(
      updateCommitment({ commitmentRepository }, { familyId: "family-1", id: commitment.id, changes: { dueDay: 0 } }),
    ).rejects.toThrow("dueDay must be an integer between 1 and 31");
  });
});
