import { findOrCreateUser } from "../../users/application/find-or-create-user";
import type { UserRepository } from "../../users/domain/user-repository";
import { signAppJwt } from "../../../shared/jwt";

type Dependencies = {
  userRepository: UserRepository;
  jwtSecret: string;
};

const DEV_USER_PROFILE = {
  googleId: "dev-user",
  email: "dev@ikis.local",
  name: "Dev User",
};

export const loginAsDevUser = async ({ userRepository, jwtSecret }: Dependencies): Promise<string> => {
  const user = await findOrCreateUser(userRepository, DEV_USER_PROFILE);

  return signAppJwt(jwtSecret, { sub: user.id });
};
