import { describe, expect, it } from "vitest";
import { createFamilyForUser } from "../../../../src/modules/families/application/create-family-for-user";
import type { Family } from "../../../../src/modules/families/domain/family";
import type { FamilyRepository, NewFamily } from "../../../../src/modules/families/domain/family-repository";
import { InMemoryUserRepository } from "../../users/in-memory-user-repository";

class InMemoryFamilyRepository implements FamilyRepository {
  async create(input: NewFamily) {
    const family: Family = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...input,
    };
    return family;
  }
}

describe("createFamilyForUser", () => {
  it("creates a family and assigns it to the user", async () => {
    const userRepository = new InMemoryUserRepository();
    const familyRepository = new InMemoryFamilyRepository();
    const user = await userRepository.create({
      googleId: "google-1",
      email: "ana@example.com",
      name: "Ana",
    });

    const family = await createFamilyForUser(
      { userRepository, familyRepository },
      { userId: user.id, name: "García" },
    );

    expect(family.name).toBe("García");
    const updatedUser = await userRepository.findById(user.id);
    expect(updatedUser?.familyId).toBe(family.id);
  });

  it("throws when the user already belongs to a family", async () => {
    const userRepository = new InMemoryUserRepository();
    const familyRepository = new InMemoryFamilyRepository();
    const user = await userRepository.create({
      googleId: "google-1",
      email: "ana@example.com",
      name: "Ana",
    });
    await userRepository.assignFamily(user.id, "existing-family-id");

    await expect(
      createFamilyForUser({ userRepository, familyRepository }, { userId: user.id, name: "García" }),
    ).rejects.toThrow("User already belongs to a family");
  });

  it("throws when the user does not exist", async () => {
    const userRepository = new InMemoryUserRepository();
    const familyRepository = new InMemoryFamilyRepository();

    await expect(
      createFamilyForUser({ userRepository, familyRepository }, { userId: "missing-user", name: "García" }),
    ).rejects.toThrow("User not found");
  });
});
