import type { User } from "../domain/user";
import type { NewUser, UserRepository } from "../domain/user-repository";

export const findOrCreateUser = async (repository: UserRepository, profile: NewUser): Promise<User> => {
  const existing = await repository.findByGoogleId(profile.googleId);
  if (existing) {
    return existing;
  }

  return repository.create(profile);
};
