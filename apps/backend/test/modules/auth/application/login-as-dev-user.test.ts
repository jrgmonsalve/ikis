import { describe, expect, it } from "vitest";
import { loginAsDevUser } from "../../../../src/modules/auth/application/login-as-dev-user";
import { verifyAppJwt } from "../../../../src/shared/jwt";
import { InMemoryUserRepository } from "../../users/in-memory-user-repository";

describe("loginAsDevUser", () => {
  it("creates the dev test user on first call and returns a valid JWT", async () => {
    const userRepository = new InMemoryUserRepository();

    const token = await loginAsDevUser({ userRepository, jwtSecret: "test-secret" });

    const payload = await verifyAppJwt("test-secret", token);
    const user = await userRepository.findByGoogleId("dev-user");
    expect(payload.sub).toBe(user?.id);
  });

  it("reuses the same dev user across calls", async () => {
    const userRepository = new InMemoryUserRepository();

    const firstToken = await loginAsDevUser({ userRepository, jwtSecret: "test-secret" });
    const secondToken = await loginAsDevUser({ userRepository, jwtSecret: "test-secret" });

    const firstPayload = await verifyAppJwt("test-secret", firstToken);
    const secondPayload = await verifyAppJwt("test-secret", secondToken);
    expect(firstPayload.sub).toBe(secondPayload.sub);
  });
});
