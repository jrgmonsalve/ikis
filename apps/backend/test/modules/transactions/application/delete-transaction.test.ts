import { describe, expect, it } from "vitest";
import { createTransaction } from "../../../../src/modules/transactions/application/create-transaction";
import { deleteTransaction } from "../../../../src/modules/transactions/application/delete-transaction";
import { listTransactions } from "../../../../src/modules/transactions/application/list-transactions";
import { InMemoryAccountRepository } from "../../accounts/in-memory-account-repository";
import { InMemoryCategoryRepository } from "../../categories/in-memory-category-repository";
import { InMemoryTransactionRepository } from "../in-memory-transaction-repository";

const setup = () => {
  const accountRepository = new InMemoryAccountRepository();
  const categoryRepository = new InMemoryCategoryRepository();
  const transactionRepository = new InMemoryTransactionRepository(accountRepository);
  return { accountRepository, categoryRepository, transactionRepository };
};

describe("deleteTransaction", () => {
  it("reverts the account balance and removes the transaction from listings", async () => {
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

    const { account: updatedAccount } = await deleteTransaction(
      { transactionRepository },
      { familyId: "family-1", id: transaction.id },
    );

    expect(updatedAccount.balance).toBe(0);
    expect(await listTransactions({ transactionRepository }, { familyId: "family-1" })).toHaveLength(0);
  });

  it("rejects deleting a transaction from another family", async () => {
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
      deleteTransaction({ transactionRepository }, { familyId: "family-2", id: transaction.id }),
    ).rejects.toThrow("Transaction not found");
  });
});
