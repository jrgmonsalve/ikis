import { describe, expect, it } from "vitest";
import { signAppJwt, verifyAppJwt } from "../../src/shared/jwt";

describe("app jwt", () => {
  it("round-trips a payload through sign and verify", async () => {
    const token = await signAppJwt("test-secret", { sub: "user-1" });

    const payload = await verifyAppJwt("test-secret", token);

    expect(payload.sub).toBe("user-1");
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signAppJwt("test-secret", { sub: "user-1" });

    await expect(verifyAppJwt("another-secret", token)).rejects.toThrow();
  });

  it("rejects a malformed token", async () => {
    await expect(verifyAppJwt("test-secret", "not-a-jwt")).rejects.toThrow();
  });
});
