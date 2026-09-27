import { describe, expect, it } from "vitest";
import { createCommitment } from "../../../../src/modules/commitments/application/create-commitment";
import { InMemoryAccountRepository } from "../../accounts/in-memory-account-repository";
import { InMemoryCategoryRepository } from "../../categories/in-memory-category-repository";
import { InMemoryCommitmentRepository } from "../in-memory-commitment-repository";

const setup = async () => {
  const commitmentRepository = new InMemoryCommitmentRepository();
  const accountRepository = new InMemoryAccountRepository();
  const categoryRepository = new InMemoryCategoryRepository();
  const account = await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
  return { commitmentRepository, accountRepository, categoryRepository, accountId: account.id };
};

describe("createCommitment", () => {
  it("creates a commitment with default notifyDaysBefore", async () => {
    const deps = await setup();

    const commitment = await createCommitment(deps, {
      familyId: "family-1",
      name: "Arriendo",
      amountLimit: 800000,
      dueDay: 5,
      accountId: deps.accountId,
    });

    expect(commitment.notifyDaysBefore).toBe(3);
    expect(commitment.archivedAt).toBeNull();
    expect(commitment.accountId).toBe(deps.accountId);
    expect(commitment.categoryId).toBeNull();
  });

  it("creates a commitment linked to a category", async () => {
    const deps = await setup();
    const category = await deps.categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });

    const commitment = await createCommitment(deps, {
      familyId: "family-1",
      name: "Arriendo",
      amountLimit: 800000,
      dueDay: 5,
      accountId: deps.accountId,
      categoryId: category.id,
    });

    expect(commitment.categoryId).toBe(category.id);
  });

  it("rejects an invalid amountLimit", async () => {
    const deps = await setup();

    await expect(
      createCommitment(deps, { familyId: "family-1", name: "Arriendo", amountLimit: 0, dueDay: 5, accountId: deps.accountId }),
    ).rejects.toThrow("amountLimit must be greater than zero");
  });

  it("rejects an invalid dueDay", async () => {
    const deps = await setup();

    await expect(
      createCommitment(deps, { familyId: "family-1", name: "Arriendo", amountLimit: 800000, dueDay: 32, accountId: deps.accountId }),
    ).rejects.toThrow("dueDay must be an integer between 1 and 31");
  });

  it("rejects an account that doesn't exist", async () => {
    const deps = await setup();

    await expect(
      createCommitment(deps, { familyId: "family-1", name: "Arriendo", amountLimit: 800000, dueDay: 5, accountId: "ghost" }),
    ).rejects.toThrow("Account not found");
  });

  it("rejects a category that doesn't exist", async () => {
    const deps = await setup();

    await expect(
      createCommitment(deps, {
        familyId: "family-1",
        name: "Arriendo",
        amountLimit: 800000,
        dueDay: 5,
        accountId: deps.accountId,
        categoryId: "ghost",
      }),
    ).rejects.toThrow("Category not found");
  });
});
