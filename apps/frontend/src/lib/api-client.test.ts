import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiError } from "./api-client";
import { clearToken, setToken } from "./auth-storage";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    clearToken();
    vi.unstubAllGlobals();
  });

  it("sends the stored JWT as a Bearer token when present", async () => {
    setToken("test-jwt");
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await apiFetch("/me");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer test-jwt");
  });

  it("omits the Authorization header when there is no token", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await apiFetch("/health");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("throws an ApiError with the backend message on non-ok responses", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "name is required" }), { status: 400 }),
    );

    await expect(apiFetch("/categories", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 400,
      message: "name is required",
    });
  });

  it("throws an ApiError instance", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 401 }));

    await expect(apiFetch("/me")).rejects.toBeInstanceOf(ApiError);
  });

  it("returns undefined for 204 No Content responses", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiFetch("/categories/1", { method: "DELETE" })).resolves.toBeUndefined();
  });
});
