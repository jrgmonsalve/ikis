import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { DrizzleFamilyRepository } from "../../../../src/modules/families/infrastructure/persistence/drizzle-family-repository";

describe("DrizzleFamilyRepository", () => {
  it("creates a family", async () => {
    const repository = new DrizzleFamilyRepository(env.DB);

    const family = await repository.create({ name: "García" });

    expect(family.name).toBe("García");
    expect(family.id).toBeTruthy();
    expect(family.createdAt).toBeInstanceOf(Date);
  });
});
