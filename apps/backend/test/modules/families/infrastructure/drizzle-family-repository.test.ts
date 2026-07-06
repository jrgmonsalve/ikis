import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createDb } from "../../../../src/shared/db";
import { DrizzleFamilyRepository } from "../../../../src/modules/families/infrastructure/persistence/drizzle-family-repository";

describe("DrizzleFamilyRepository", () => {
  it("creates a family with a default budgetCycleEndDay of 31", async () => {
    const repository = new DrizzleFamilyRepository(createDb(env.DB));

    const family = await repository.create({ name: "García" });

    expect(family.name).toBe("García");
    expect(family.id).toBeTruthy();
    expect(family.budgetCycleEndDay).toBe(31);
    expect(family.createdAt).toBeInstanceOf(Date);
  });

  it("finds a family by id", async () => {
    const repository = new DrizzleFamilyRepository(createDb(env.DB));
    const created = await repository.create({ name: "García" });

    expect(await repository.findById(created.id)).toEqual(created);
    expect(await repository.findById(crypto.randomUUID())).toBeNull();
  });

  it("updates the budgetCycleEndDay", async () => {
    const repository = new DrizzleFamilyRepository(createDb(env.DB));
    const created = await repository.create({ name: "García" });

    const updated = await repository.update(created.id, { budgetCycleEndDay: 27 });

    expect(updated.budgetCycleEndDay).toBe(27);
  });
});
