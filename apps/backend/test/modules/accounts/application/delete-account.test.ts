import { describe, expect, it } from "vitest";
import { deleteAccount } from "../../../../src/modules/accounts/application/delete-account";
import { createTransaction } from "../../../../src/modules/transactions/application/create-transaction";
import { createTransfer } from "../../../../src/modules/transfers/application/create-transfer";
import { deleteTransaction } from "../../../../src/modules/transactions/application/delete-transaction";
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

describe("deleteAccount", () => {
  it("deletes an account without movements", async () => {
    const deps = setup();
    const account = await deps.accountRepository.create({ familyId: "family-1", name: "Empty", type: "cash" });

    await deleteAccount(deps, { familyId: "family-1", id: account.id });

    expect(await deps.accountRepository.findById("family-1", account.id)).toBeNull();
  });

  it("rejects deleting an account with transactions", async () => {
    const deps = setup();
    const account = await deps.accountRepository.create({ familyId: "family-1", name: "Used", type: "checking" });
    await createTransaction(deps, {
      familyId: "family-1",
      accountId: account.id,
      categoryId: null,
      createdByUserId: "user-1",
      amount: 5000,
      description: null,
      occurredAt: "2026-07-05",
    });

    await expect(deleteAccount(deps, { familyId: "family-1", id: account.id })).rejects.toThrow(
      "Account has movements; archive it instead",
    );
  });

  it("deletes an account whose transactions were all soft-deleted, purging them", async () => {
    const deps = setup();
    const account = await deps.accountRepository.create({ familyId: "family-1", name: "Used", type: "checking" });
    const { transaction } = await createTransaction(deps, {
      familyId: "family-1",
      accountId: account.id,
      categoryId: null,
      createdByUserId: "user-1",
      amount: 5000,
      description: null,
      occurredAt: "2026-07-05",
    });
    await deleteTransaction(deps, { familyId: "family-1", id: transaction.id });

    await deleteAccount(deps, { familyId: "family-1", id: account.id });

    expect(await deps.accountRepository.findById("family-1", account.id)).toBeNull();
    expect(deps.transactionRepository.transactions).toHaveLength(0);
  });

  it("rejects deleting an account involved in a transfer on either side", async () => {
    const deps = setup();
    const from = await deps.accountRepository.create({ familyId: "family-1", name: "From", type: "checking" });
    const to = await deps.accountRepository.create({ familyId: "family-1", name: "To", type: "savings" });
    await createTransfer(deps, {
      familyId: "family-1",
      fromAccountId: from.id,
      toAccountId: to.id,
      createdByUserId: "user-1",
      amount: 1000,
      description: null,
      occurredAt: "2026-07-05",
    });

    await expect(deleteAccount(deps, { familyId: "family-1", id: from.id })).rejects.toThrow(
      "Account has movements; archive it instead",
    );
    await expect(deleteAccount(deps, { familyId: "family-1", id: to.id })).rejects.toThrow(
      "Account has movements; archive it instead",
    );
  });

  it("rejects deleting an account from another family", async () => {
    const deps = setup();
    const account = await deps.accountRepository.create({ familyId: "family-2", name: "Other", type: "cash" });

    await expect(deleteAccount(deps, { familyId: "family-1", id: account.id })).rejects.toThrow("Account not found");
  });
});
