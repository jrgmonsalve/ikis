import { describe, expect, it } from "vitest";
import { loginWithGoogle } from "../../../../src/modules/auth/application/login-with-google";
import type { GoogleIdTokenVerifier, GoogleProfile } from "../../../../src/modules/auth/domain/google-id-token-verifier";
import { verifyAppJwt } from "../../../../src/shared/jwt";
import { InMemoryUserRepository } from "../../users/in-memory-user-repository";

class FakeGoogleIdTokenVerifier implements GoogleIdTokenVerifier {
  constructor(private readonly profile: GoogleProfile) {}

  async verify() {
    return this.profile;
  }
}

describe("loginWithGoogle", () => {
  it("creates a user on first login and returns a valid JWT", async () => {
    const userRepository = new InMemoryUserRepository();
    const googleIdTokenVerifier = new FakeGoogleIdTokenVerifier({
      googleId: "google-1",
      email: "ana@example.com",
      name: "Ana",
    });

    const token = await loginWithGoogle(
      { googleIdTokenVerifier, userRepository, jwtSecret: "test-secret" },
      "any-id-token",
    );

    const payload = await verifyAppJwt("test-secret", token);
    const user = await userRepository.findByGoogleId("google-1");
    expect(payload.sub).toBe(user?.id);
  });

  it("reuses the existing user on subsequent logins", async () => {
    const userRepository = new InMemoryUserRepository();
    const googleIdTokenVerifier = new FakeGoogleIdTokenVerifier({
      googleId: "google-1",
      email: "ana@example.com",
      name: "Ana",
    });

    await loginWithGoogle({ googleIdTokenVerifier, userRepository, jwtSecret: "test-secret" }, "any-id-token");
    const secondToken = await loginWithGoogle(
      { googleIdTokenVerifier, userRepository, jwtSecret: "test-secret" },
      "any-id-token",
    );

    const usersWithThatGoogleId = await userRepository.findByGoogleId("google-1");
    const payload = await verifyAppJwt("test-secret", secondToken);
    expect(payload.sub).toBe(usersWithThatGoogleId?.id);
  });
});
