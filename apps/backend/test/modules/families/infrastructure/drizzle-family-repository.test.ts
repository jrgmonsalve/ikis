import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createDb } from "../../../../src/shared/db";
import { DrizzleFamilyRepository } from "../../../../src/modules/families/infrastructure/persistence/drizzle-family-repository";

describe("DrizzleFamilyRepository", () => {
  it("creates a family with a default budgetCycleStartDay of 1", async () => {
    const repository = new DrizzleFamilyRepository(createDb(env.DB));

    const family = await repository.create({ name: "García" });

    expect(family.name).toBe("García");
    expect(family.id).toBeTruthy();
    expect(family.budgetCycleStartDay).toBe(1);
    expect(family.createdAt).toBeInstanceOf(Date);
  });

  it("finds a family by id", async () => {
    const repository = new DrizzleFamilyRepository(createDb(env.DB));
    const created = await repository.create({ name: "García" });

    expect(await repository.findById(created.id)).toEqual(created);
    expect(await repository.findById(crypto.randomUUID())).toBeNull();
  });

  it("updates the budgetCycleStartDay", async () => {
    const repository = new DrizzleFamilyRepository(createDb(env.DB));
    const created = await repository.create({ name: "García" });

    const updated = await repository.update(created.id, { budgetCycleStartDay: 27 });

    expect(updated.budgetCycleStartDay).toBe(27);
  });
});
