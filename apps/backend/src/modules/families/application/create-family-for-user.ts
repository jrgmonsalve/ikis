import type { UserRepository } from "../../users/domain/user-repository";
import type { Family } from "../domain/family";
import type { FamilyRepository, NewFamily } from "../domain/family-repository";

type Dependencies = {
  familyRepository: FamilyRepository;
  userRepository: UserRepository;
};

type CreateFamilyInput = NewFamily & { userId: string };

export const createFamilyForUser = async (
  { familyRepository, userRepository }: Dependencies,
  { userId, ...newFamily }: CreateFamilyInput,
): Promise<Family> => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  if (user.familyId) {
    throw new Error("User already belongs to a family");
  }

  const family = await familyRepository.create(newFamily);
  await userRepository.assignFamily(userId, family.id);

  return family;
};
