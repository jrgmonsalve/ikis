import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { DrizzleAccountRepository } from "../../../../src/modules/accounts/infrastructure/persistence/drizzle-account-repository";
import { createDb } from "../../../../src/shared/db";

describe("DrizzleAccountRepository", () => {
  it("creates an account with a zero balance and the default currency", async () => {
    const repository = new DrizzleAccountRepository(createDb(env.DB));
    const familyId = crypto.randomUUID();

    const account = await repository.create({ familyId, name: "Checking", type: "checking" });

    expect(account.balance).toBe(0);
    expect(account.currency).toBe("COP");
  });

  it("finds an account scoped to its family", async () => {
    const repository = new DrizzleAccountRepository(createDb(env.DB));
    const familyId = crypto.randomUUID();
    const otherFamilyId = crypto.randomUUID();
    const created = await repository.create({ familyId, name: "Checking", type: "checking" });

    expect(await repository.findById(familyId, created.id)).toEqual(created);
    expect(await repository.findById(otherFamilyId, created.id)).toBeNull();
  });

  it("lists all accounts for a family only", async () => {
    const repository = new DrizzleAccountRepository(createDb(env.DB));
    const familyId = crypto.randomUUID();
    const otherFamilyId = crypto.randomUUID();
    await repository.create({ familyId, name: "Checking", type: "checking" });
    await repository.create({ familyId: otherFamilyId, name: "Other family's account", type: "cash" });

    const result = await repository.findAllByFamily(familyId);

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Checking");
  });

  it("updates an account's name", async () => {
    const repository = new DrizzleAccountRepository(createDb(env.DB));
    const familyId = crypto.randomUUID();
    const created = await repository.create({ familyId, name: "Checking", type: "checking" });

    const updated = await repository.update(familyId, created.id, { name: "Main checking" });

    expect(updated.name).toBe("Main checking");
  });
});
