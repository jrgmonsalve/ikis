import { describe, expect, it } from "vitest";
import { createTransfer } from "../../../../src/modules/transfers/application/create-transfer";
import { deleteTransfer } from "../../../../src/modules/transfers/application/delete-transfer";
import { listTransfers } from "../../../../src/modules/transfers/application/list-transfers";
import { InMemoryAccountRepository } from "../../accounts/in-memory-account-repository";
import { InMemoryTransferRepository } from "../in-memory-transfer-repository";

const setup = () => {
  const accountRepository = new InMemoryAccountRepository();
  const transferRepository = new InMemoryTransferRepository(accountRepository);
  return { accountRepository, transferRepository };
};

describe("deleteTransfer", () => {
  it("reverts both balances and removes the transfer from listings", async () => {
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

    await deleteTransfer({ transferRepository }, { familyId: "family-1", id: transfer.id });

    expect(checking.balance).toBe(0);
    expect(savings.balance).toBe(0);
    expect(await listTransfers({ transferRepository }, { familyId: "family-1" })).toHaveLength(0);
  });

  it("rejects deleting a transfer from another family", async () => {
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
      deleteTransfer({ transferRepository }, { familyId: "family-2", id: transfer.id }),
    ).rejects.toThrow("Transfer not found");
  });
});
