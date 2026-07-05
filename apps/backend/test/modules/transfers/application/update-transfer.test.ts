import { describe, expect, it } from "vitest";
import { createTransfer } from "../../../../src/modules/transfers/application/create-transfer";
import { updateTransfer } from "../../../../src/modules/transfers/application/update-transfer";
import { InMemoryAccountRepository } from "../../accounts/in-memory-account-repository";
import { InMemoryTransferRepository } from "../in-memory-transfer-repository";

const setup = () => {
  const accountRepository = new InMemoryAccountRepository();
  const transferRepository = new InMemoryTransferRepository(accountRepository);
  return { accountRepository, transferRepository };
};

describe("updateTransfer", () => {
  it("adjusts both balances by the amount difference", async () => {
    const { accountRepository, transferRepository } = setup();
    const checking = await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const savings = await accountRepository.create({ familyId: "family-1", name: "Savings", type: "savings" });
    const { transfer } = await createTransfer(
      { transferRepository, accountRepository },
      {
        familyId: "family-1",
        fromAccountId: checking.id,
        toAccountId: savings.id,
        createdByUserId: "user-1",
        amount: 10000,
        description: null,
        occurredAt: "2026-07-05",
      },
    );

    await updateTransfer(
      { transferRepository, accountRepository },
      { familyId: "family-1", id: transfer.id, changes: { amount: 15000 } },
    );

    expect(checking.balance).toBe(-15000);
    expect(savings.balance).toBe(15000);
  });

  it("moves the effect to a new destination account", async () => {
    const { accountRepository, transferRepository } = setup();
    const checking = await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const savings = await accountRepository.create({ familyId: "family-1", name: "Savings", type: "savings" });
    const cash = await accountRepository.create({ familyId: "family-1", name: "Cash", type: "cash" });
    const { transfer } = await createTransfer(
      { transferRepository, accountRepository },
      {
        familyId: "family-1",
        fromAccountId: checking.id,
        toAccountId: savings.id,
        createdByUserId: "user-1",
        amount: 10000,
        description: null,
        occurredAt: "2026-07-05",
      },
    );

    await updateTransfer(
      { transferRepository, accountRepository },
      { familyId: "family-1", id: transfer.id, changes: { toAccountId: cash.id } },
    );

    expect(checking.balance).toBe(-10000);
    expect(savings.balance).toBe(0);
    expect(cash.balance).toBe(10000);
  });

  it("rejects updating a transfer to point both legs at the same account", async () => {
    const { accountRepository, transferRepository } = setup();
    const checking = await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const savings = await accountRepository.create({ familyId: "family-1", name: "Savings", type: "savings" });
    const { transfer } = await createTransfer(
      { transferRepository, accountRepository },
      {
        familyId: "family-1",
        fromAccountId: checking.id,
        toAccountId: savings.id,
        createdByUserId: "user-1",
        amount: 10000,
        description: null,
        occurredAt: "2026-07-05",
      },
    );

    await expect(
      updateTransfer(
        { transferRepository, accountRepository },
        { familyId: "family-1", id: transfer.id, changes: { toAccountId: checking.id } },
      ),
    ).rejects.toThrow("Cannot transfer to the same account");
  });

  it("rejects updating a transfer from another family", async () => {
    const { accountRepository, transferRepository } = setup();
    const checking = await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    const savings = await accountRepository.create({ familyId: "family-1", name: "Savings", type: "savings" });
    const { transfer } = await createTransfer(
      { transferRepository, accountRepository },
      {
        familyId: "family-1",
        fromAccountId: checking.id,
        toAccountId: savings.id,
        createdByUserId: "user-1",
        amount: 10000,
        description: null,
        occurredAt: "2026-07-05",
      },
    );

    await expect(
      updateTransfer(
        { transferRepository, accountRepository },
        { familyId: "family-2", id: transfer.id, changes: { amount: 5000 } },
      ),
    ).rejects.toThrow("Transfer not found");
  });
});
