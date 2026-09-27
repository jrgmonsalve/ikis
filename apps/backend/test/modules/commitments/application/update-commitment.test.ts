import { describe, expect, it } from "vitest";
import { updateCommitment } from "../../../../src/modules/commitments/application/update-commitment";
import { InMemoryAccountRepository } from "../../accounts/in-memory-account-repository";
import { InMemoryCategoryRepository } from "../../categories/in-memory-category-repository";
import { InMemoryCommitmentRepository } from "../in-memory-commitment-repository";

const setup = async () => {
  const commitmentRepository = new InMemoryCommitmentRepository();
  const accountRepository = new InMemoryAccountRepository();
  const categoryRepository = new InMemoryCategoryRepository();
  const account = await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
  const commitment = await commitmentRepository.create({
    familyId: "family-1",
    name: "Arriendo",
    amountLimit: 800000,
    dueDay: 5,
    accountId: account.id,
  });
  return { commitmentRepository, accountRepository, categoryRepository, account, commitment };
};

describe("updateCommitment", () => {
  it("updates fields on an existing commitment", async () => {
    const deps = await setup();

    const updated = await updateCommitment(deps, { familyId: "family-1", id: deps.commitment.id, changes: { amountLimit: 850000 } });

    expect(updated.amountLimit).toBe(850000);
  });

  it("archives a commitment via archivedAt", async () => {
    const deps = await setup();

    const archived = await updateCommitment(deps, {
      familyId: "family-1",
      id: deps.commitment.id,
      changes: { archivedAt: new Date() },
    });

    expect(archived.archivedAt).not.toBeNull();
  });

  it("throws when the commitment does not exist", async () => {
    const deps = await setup();

    await expect(
      updateCommitment(deps, { familyId: "family-1", id: "ghost", changes: { amountLimit: 1000 } }),
    ).rejects.toThrow("Commitment not found");
  });

  it("rejects an invalid dueDay change", async () => {
    const deps = await setup();

    await expect(
      updateCommitment(deps, { familyId: "family-1", id: deps.commitment.id, changes: { dueDay: 0 } }),
    ).rejects.toThrow("dueDay must be an integer between 1 and 31");
  });

  it("rejects changing to an account that doesn't exist", async () => {
    const deps = await setup();

    await expect(
      updateCommitment(deps, { familyId: "family-1", id: deps.commitment.id, changes: { accountId: "ghost" } }),
    ).rejects.toThrow("Account not found");
  });

  it("updates the linked category", async () => {
    const deps = await setup();
    const category = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });

    const updated = await updateCommitment(deps, { familyId: "family-1", id: deps.commitment.id, changes: { categoryId: category.id } });

    expect(updated.categoryId).toBe(category.id);
  });
});
