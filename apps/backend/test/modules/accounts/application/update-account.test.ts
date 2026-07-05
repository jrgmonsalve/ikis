import { describe, expect, it } from "vitest";
import { updateAccount } from "../../../../src/modules/accounts/application/update-account";
import { InMemoryAccountRepository } from "../in-memory-account-repository";

describe("updateAccount", () => {
  it("renames an account", async () => {
    const accountRepository = new InMemoryAccountRepository();
    const account = await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });

    const updated = await updateAccount(
      { accountRepository },
      { familyId: "family-1", id: account.id, changes: { name: "Main checking" } },
    );

    expect(updated.name).toBe("Main checking");
  });

  it("rejects updating an account from another family", async () => {
    const accountRepository = new InMemoryAccountRepository();
    const account = await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });

    await expect(
      updateAccount({ accountRepository }, { familyId: "family-2", id: account.id, changes: { name: "Hijacked" } }),
    ).rejects.toThrow("Account not found");
  });
});
