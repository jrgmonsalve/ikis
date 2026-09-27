import { describe, expect, it } from "vitest";
import { listCommitments } from "../../../../src/modules/commitments/application/list-commitments";
import { InMemoryCommitmentRepository } from "../in-memory-commitment-repository";

describe("listCommitments", () => {
  it("returns all commitments for the family, including archived ones", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();
    await commitmentRepository.create({ familyId: "family-1", name: "Arriendo", amountLimit: 800000, dueDay: 5 });
    const archived = await commitmentRepository.create({ familyId: "family-1", name: "Gimnasio", amountLimit: 60000, dueDay: 10 });
    await commitmentRepository.update("family-1", archived.id, { archivedAt: new Date() });
    await commitmentRepository.create({ familyId: "family-2", name: "Otra familia", amountLimit: 1, dueDay: 1 });

    const commitments = await listCommitments({ commitmentRepository }, { familyId: "family-1" });

    expect(commitments).toHaveLength(2);
  });
});
