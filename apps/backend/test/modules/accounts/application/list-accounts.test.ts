import { describe, expect, it } from "vitest";
import { listAccounts } from "../../../../src/modules/accounts/application/list-accounts";
import { InMemoryAccountRepository } from "../in-memory-account-repository";

describe("listAccounts", () => {
  it("lists only the accounts belonging to the given family", async () => {
    const accountRepository = new InMemoryAccountRepository();
    await accountRepository.create({ familyId: "family-1", name: "Checking", type: "checking" });
    await accountRepository.create({ familyId: "family-2", name: "Other family's account", type: "cash" });

    const result = await listAccounts({ accountRepository }, { familyId: "family-1" });

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Checking");
  });
});
