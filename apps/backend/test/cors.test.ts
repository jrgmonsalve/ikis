import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("CORS", () => {
  it("allows the configured origin", async () => {
    const app = createApp();

    const response = await app.request(
      "/health",
      { headers: { Origin: "http://localhost:5173" } },
      { ...env, ALLOWED_ORIGIN: "http://localhost:5173" },
    );

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });

  it("rejects an unrecognized origin", async () => {
    const app = createApp();

    const response = await app.request(
      "/health",
      { headers: { Origin: "http://evil.example.com" } },
      { ...env, ALLOWED_ORIGIN: "http://localhost:5173" },
    );

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
