import type { User } from "../../../src/modules/users/domain/user";
import type { NewUser, UserRepository } from "../../../src/modules/users/domain/user-repository";

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  async findById(id: string) {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByGoogleId(googleId: string) {
    return this.users.find((user) => user.googleId === googleId) ?? null;
  }

  async create(input: NewUser) {
    const user: User = {
      id: crypto.randomUUID(),
      familyId: null,
      createdAt: new Date(),
      ...input,
    };
    this.users.push(user);
    return user;
  }

  async assignFamily(userId: string, familyId: string) {
    const user = this.users.find((existing) => existing.id === userId);
    if (user) {
      user.familyId = familyId;
    }
  }
}
