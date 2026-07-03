import { describe, expect, it } from "vitest";
import { findOrCreateUser } from "../../../../src/modules/users/application/find-or-create-user";
import type { User } from "../../../../src/modules/users/domain/user";
import type { NewUser, UserRepository } from "../../../../src/modules/users/domain/user-repository";

class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  async findByGoogleId(googleId: string) {
    return this.users.find((user) => user.googleId === googleId) ?? null;
  }

  async create(input: NewUser) {
    const user: User = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...input,
    };
    this.users.push(user);
    return user;
  }
}

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
