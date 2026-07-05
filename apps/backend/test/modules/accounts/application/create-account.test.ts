import { describe, expect, it } from "vitest";
import { createAccount } from "../../../../src/modules/accounts/application/create-account";
import { InMemoryAccountRepository } from "../in-memory-account-repository";

describe("createAccount", () => {
  it("creates an account with a zero starting balance", async () => {
    const accountRepository = new InMemoryAccountRepository();

    const account = await createAccount(
      { accountRepository },
      { familyId: "family-1", name: "Main checking", type: "checking" },
    );

    expect(account.name).toBe("Main checking");
    expect(account.balance).toBe(0);
    expect(account.currency).toBe("COP");
  });

  it("uses the given currency when provided", async () => {
    const accountRepository = new InMemoryAccountRepository();

    const account = await createAccount(
      { accountRepository },
      { familyId: "family-1", name: "Savings", type: "savings", currency: "USD" },
    );

    expect(account.currency).toBe("USD");
  });
});
