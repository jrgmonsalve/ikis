import { describe, expect, it } from "vitest";
import { updateAccount } from "../../../../src/modules/accounts/application/update-account";
import { createTransaction } from "../../../../src/modules/transactions/application/create-transaction";
import { createTransfer } from "../../../../src/modules/transfers/application/create-transfer";
import { InMemoryCategoryRepository } from "../../categories/in-memory-category-repository";
import { InMemoryTransactionRepository } from "../../transactions/in-memory-transaction-repository";
import { InMemoryTransferRepository } from "../../transfers/in-memory-transfer-repository";
import { InMemoryAccountRepository } from "../in-memory-account-repository";

const setup = () => {
  const accountRepository = new InMemoryAccountRepository();
  const categoryRepository = new InMemoryCategoryRepository();
  const transactionRepository = new InMemoryTransactionRepository(accountRepository);
  const transferRepository = new InMemoryTransferRepository(accountRepository);
  return { accountRepository, categoryRepository, transactionRepository, transferRepository };
};

describe("archived account guard", () => {
  it("archives and unarchives an account through updateAccount", async () => {
    const deps = setup();
    const account = await deps.accountRepository.create({ familyId: "family-1", name: "Old", type: "cash" });

    const archived = await updateAccount(deps, {
      familyId: "family-1",
      id: account.id,
      changes: { archivedAt: new Date() },
    });
    expect(archived.archivedAt).not.toBeNull();

    const restored = await updateAccount(deps, { familyId: "family-1", id: account.id, changes: { archivedAt: null } });
    expect(restored.archivedAt).toBeNull();
  });

  it("rejects creating a transaction on an archived account", async () => {
    const deps = setup();
    const account = await deps.accountRepository.create({ familyId: "family-1", name: "Old", type: "cash" });
    await updateAccount(deps, { familyId: "family-1", id: account.id, changes: { archivedAt: new Date() } });

    await expect(
      createTransaction(deps, {
        familyId: "family-1",
        accountId: account.id,
        categoryId: null,
        createdByUserId: "user-1",
        amount: 5000,
        description: null,
        occurredAt: "2026-07-05",
      }),
    ).rejects.toThrow("Account is archived");
  });

  it("rejects creating a transfer touching an archived account on either side", async () => {
    const deps = setup();
    const active = await deps.accountRepository.create({ familyId: "family-1", name: "Active", type: "checking" });
    const archived = await deps.accountRepository.create({ familyId: "family-1", name: "Old", type: "cash" });
    await updateAccount(deps, { familyId: "family-1", id: archived.id, changes: { archivedAt: new Date() } });

    const base = { familyId: "family-1", createdByUserId: "user-1", amount: 1000, description: null, occurredAt: "2026-07-05" };

    await expect(
      createTransfer(deps, { ...base, fromAccountId: archived.id, toAccountId: active.id }),
    ).rejects.toThrow("Account is archived");
    await expect(
      createTransfer(deps, { ...base, fromAccountId: active.id, toAccountId: archived.id }),
    ).rejects.toThrow("Account is archived");
  });
});
