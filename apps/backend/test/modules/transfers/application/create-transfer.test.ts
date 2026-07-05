import { describe, expect, it } from "vitest";
import { createTransfer } from "../../../../src/modules/transfers/application/create-transfer";
import { InMemoryAccountRepository } from "../../accounts/in-memory-account-repository";
import { InMemoryTransferRepository } from "../in-memory-transfer-repository";

const setup = () => {
  const accountRepository = new InMemoryAccountRepository();
  const transferRepository = new InMemoryTransferRepository(accountRepository);
  return { accountRepository, transferRepository };
};

describe("createTransfer", () => {
  it("debits the source account and credits the destination account", async () => {
    const { accountRepository, transferRepository } = setup();
    const checking = await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const savings = await accountRepository.create({ familyId: "family-1", name: "Savings", type: "savings" });

    const { fromAccount, toAccount } = await createTransfer(
      { transferRepository, accountRepository },
      {
        familyId: "family-1",
        fromAccountId: checking.id,
        toAccountId: savings.id,
        createdByUserId: "user-1",
        amount: 20000,
        description: "Move to savings",
        occurredAt: "2026-07-05",
      },
    );

    expect(fromAccount.balance).toBe(-20000);
    expect(toAccount.balance).toBe(20000);
  });

  it("rejects a zero or negative amount", async () => {
    const { accountRepository, transferRepository } = setup();
    const checking = await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const savings = await accountRepository.create({ familyId: "family-1", name: "Savings", type: "savings" });

    await expect(
      createTransfer(
        { transferRepository, accountRepository },
        {
          familyId: "family-1",
          fromAccountId: checking.id,
          toAccountId: savings.id,
          createdByUserId: "user-1",
          amount: 0,
          description: null,
          occurredAt: "2026-07-05",
        },
      ),
    ).rejects.toThrow("Transfer amount must be greater than zero");
  });

  it("rejects transferring an account to itself", async () => {
    const { accountRepository, transferRepository } = setup();
    const checking = await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });

    await expect(
      createTransfer(
        { transferRepository, accountRepository },
        {
          familyId: "family-1",
          fromAccountId: checking.id,
          toAccountId: checking.id,
          createdByUserId: "user-1",
          amount: 1000,
          description: null,
          occurredAt: "2026-07-05",
        },
      ),
    ).rejects.toThrow("Cannot transfer to the same account");
  });

  it("rejects a transfer involving an account from another family", async () => {
    const { accountRepository, transferRepository } = setup();
    const checking = await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const otherFamilyAccount = await accountRepository.create({
      familyId: "family-2",
      name: "Other family's account",
      type: "cash",
    });

    await expect(
      createTransfer(
        { transferRepository, accountRepository },
        {
          familyId: "family-1",
          fromAccountId: checking.id,
          toAccountId: otherFamilyAccount.id,
          createdByUserId: "user-1",
          amount: 1000,
          description: null,
          occurredAt: "2026-07-05",
        },
      ),
    ).rejects.toThrow("Account not found");
  });
});
