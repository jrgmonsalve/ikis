import { findOrCreateUser } from "../../users/application/find-or-create-user";
import type { UserRepository } from "../../users/domain/user-repository";
import { signAppJwt } from "../../../shared/jwt";
import type { GoogleIdTokenVerifier } from "../domain/google-id-token-verifier";

type Dependencies = {
  googleIdTokenVerifier: GoogleIdTokenVerifier;
  userRepository: UserRepository;
  jwtSecret: string;
};

export const loginWithGoogle = async ({ googleIdTokenVerifier, userRepository, jwtSecret }: Dependencies, idToken: string): Promise<string> => {
  const profile = await googleIdTokenVerifier.verify(idToken);
  const user = await findOrCreateUser(userRepository, profile);

  return signAppJwt(jwtSecret, { sub: user.id });
};
