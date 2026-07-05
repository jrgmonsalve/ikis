import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../../../../src/app";
import { verifyAppJwt } from "../../../../src/shared/jwt";

describe("auth routes", () => {
  it("POST /auth/dev issues a JWT when DEV_AUTH is enabled", async () => {
    const app = createApp();

    const response = await app.request("/api/v1/auth/dev", { method: "POST" }, { ...env, DEV_AUTH: "true" });

    expect(response.status).toBe(200);
    const { token } = await response.json<{ token: string }>();
    const payload = await verifyAppJwt(env.JWT_SECRET, token);
    expect(payload.sub).toBeTruthy();
  });

  it("POST /auth/dev returns 404 when DEV_AUTH is disabled", async () => {
    const app = createApp();

    const response = await app.request("/api/v1/auth/dev", { method: "POST" }, { ...env, DEV_AUTH: "false" });

    expect(response.status).toBe(404);
  });

  it("POST /auth/google requires an idToken", async () => {
    const app = createApp();

    const response = await app.request(
      "/api/v1/auth/google",
      { method: "POST", body: JSON.stringify({}), headers: { "Content-Type": "application/json" } },
      env,
    );

    expect(response.status).toBe(400);
  });
});
