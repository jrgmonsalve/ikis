import { describe, expect, it } from "vitest";
import { findOrCreateUser } from "../../../../src/modules/users/application/find-or-create-user";
import { InMemoryUserRepository } from "../in-memory-user-repository";

describe("findOrCreateUser", () => {
  it("creates a new user when none exists for the google id", async () => {
    const repository = new InMemoryUserRepository();

    const user = await findOrCreateUser(repository, {
      googleId: "google-1",
      email: "ana@example.com",
      name: "Ana",
    });

    expect(user.googleId).toBe("google-1");
    expect(user.email).toBe("ana@example.com");
  });

  it("returns the existing user when the google id is already registered", async () => {
    const repository = new InMemoryUserRepository();
    const existing = await repository.create({
      googleId: "google-1",
      email: "ana@example.com",
      name: "Ana",
    });

    const user = await findOrCreateUser(repository, {
      googleId: "google-1",
      email: "ana-new-email@example.com",
      name: "Ana",
    });

    expect(user).toEqual(existing);
  });
});
