import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
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
});
