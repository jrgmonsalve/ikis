import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { DrizzleFamilyRepository } from "../../../../src/modules/families/infrastructure/persistence/drizzle-family-repository";
import { DrizzleUserRepository } from "../../../../src/modules/users/infrastructure/persistence/drizzle-user-repository";

describe("DrizzleUserRepository", () => {
  it("creates a user and finds it by google id", async () => {
    const repository = new DrizzleUserRepository(env.DB);

    const created = await repository.create({
      googleId: "google-123",
      email: "user@example.com",
      name: "Test User",
    });

    const found = await repository.findByGoogleId("google-123");

    expect(found).toEqual(created);
  });

  it("returns null when no user matches the google id", async () => {
    const repository = new DrizzleUserRepository(env.DB);

    const found = await repository.findByGoogleId("does-not-exist");

    expect(found).toBeNull();
  });

  it("finds a user by id", async () => {
    const repository = new DrizzleUserRepository(env.DB);
    const created = await repository.create({
      googleId: "google-456",
      email: "found@example.com",
      name: "Found User",
    });

    const found = await repository.findById(created.id);

    expect(found).toEqual(created);
  });

  it("assigns a family to a user", async () => {
    const repository = new DrizzleUserRepository(env.DB);
    const familyRepository = new DrizzleFamilyRepository(env.DB);
    const created = await repository.create({
      googleId: "google-789",
      email: "family@example.com",
      name: "Family User",
    });
    const family = await familyRepository.create({ name: "García" });

    await repository.assignFamily(created.id, family.id);

    const updated = await repository.findById(created.id);
    expect(updated?.familyId).toBe(family.id);
  });
});
