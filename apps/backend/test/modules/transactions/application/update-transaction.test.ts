import { describe, expect, it } from "vitest";
import { createTransaction } from "../../../../src/modules/transactions/application/create-transaction";
import { updateTransaction } from "../../../../src/modules/transactions/application/update-transaction";
import { InMemoryAccountRepository } from "../../accounts/in-memory-account-repository";
import { InMemoryCategoryRepository } from "../../categories/in-memory-category-repository";
import { InMemoryTransactionRepository } from "../in-memory-transaction-repository";

const setup = () => {
  const accountRepository = new InMemoryAccountRepository();
  const categoryRepository = new InMemoryCategoryRepository();
  const transactionRepository = new InMemoryTransactionRepository(accountRepository);
  return { accountRepository, categoryRepository, transactionRepository };
};

describe("updateTransaction", () => {
  it("adjusts the account balance by the amount difference", async () => {
    const { accountRepository, categoryRepository, transactionRepository } = setup();
    const account = await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const { transaction } = await createTransaction(
      { transactionRepository, accountRepository, categoryRepository },
      {
        familyId: "family-1",
        accountId: account.id,
        categoryId: null,
        createdByUserId: "user-1",
        amount: -1000,
        description: null,
        occurredAt: "2026-07-05",
      },
    );

    const { accounts } = await updateTransaction(
      { transactionRepository, accountRepository, categoryRepository },
      { familyId: "family-1", id: transaction.id, changes: { amount: -3000 } },
    );

    expect(accounts[0]?.balance).toBe(-3000);
  });

  it("reverts the old account and applies the new one when the account changes", async () => {
    const { accountRepository, categoryRepository, transactionRepository } = setup();
    const accountA = await accountRepository.create({ familyId: "family-1", name: "A", type: "checking" });
    const accountB = await accountRepository.create({ familyId: "family-1", name: "B", type: "checking" });
    const { transaction } = await createTransaction(
      { transactionRepository, accountRepository, categoryRepository },
      {
        familyId: "family-1",
        accountId: accountA.id,
        categoryId: null,
        createdByUserId: "user-1",
        amount: -1000,
        description: null,
        occurredAt: "2026-07-05",
      },
    );

    await updateTransaction(
      { transactionRepository, accountRepository, categoryRepository },
      { familyId: "family-1", id: transaction.id, changes: { accountId: accountB.id } },
    );

    expect(accountA.balance).toBe(0);
    expect(accountB.balance).toBe(-1000);
  });

  it("rejects turning a transaction into an income while keeping a category", async () => {
    const { accountRepository, categoryRepository, transactionRepository } = setup();
    const account = await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const category = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    const { transaction } = await createTransaction(
      { transactionRepository, accountRepository, categoryRepository },
      {
        familyId: "family-1",
        accountId: account.id,
        categoryId: category.id,
        createdByUserId: "user-1",
        amount: -1000,
        description: null,
        occurredAt: "2026-07-05",
      },
    );

    await expect(
      updateTransaction(
        { transactionRepository, accountRepository, categoryRepository },
        { familyId: "family-1", id: transaction.id, changes: { amount: 1000 } },
      ),
    ).rejects.toThrow("Income transactions cannot have a category");
  });

  it("rejects updating a transaction from another family", async () => {
    const { accountRepository, categoryRepository, transactionRepository } = setup();
    const account = await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const { transaction } = await createTransaction(
      { transactionRepository, accountRepository, categoryRepository },
      {
        familyId: "family-1",
        accountId: account.id,
        categoryId: null,
        createdByUserId: "user-1",
        amount: -1000,
        description: null,
        occurredAt: "2026-07-05",
      },
    );

    await expect(
      updateTransaction(
        { transactionRepository, accountRepository, categoryRepository },
        { familyId: "family-2", id: transaction.id, changes: { amount: -2000 } },
      ),
    ).rejects.toThrow("Transaction not found");
  });
});
