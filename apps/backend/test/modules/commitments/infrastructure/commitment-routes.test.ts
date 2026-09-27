import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../../../../src/app";
import { DrizzleFamilyRepository } from "../../../../src/modules/families/infrastructure/persistence/drizzle-family-repository";
import { DrizzleUserRepository } from "../../../../src/modules/users/infrastructure/persistence/drizzle-user-repository";
import { createDb } from "../../../../src/shared/db";
import { signAppJwt } from "../../../../src/shared/jwt";

const createAuthenticatedUserWithFamily = async () => {
  const userRepository = new DrizzleUserRepository(createDb(env.DB));
  const familyRepository = new DrizzleFamilyRepository(createDb(env.DB));
  const user = await userRepository.create({
    googleId: crypto.randomUUID(),
    email: `${crypto.randomUUID()}@example.com`,
    name: "Test",
  });
  const family = await familyRepository.create({ name: "Test Family" });
  await userRepository.assignFamily(user.id, family.id);
  const token = await signAppJwt(env.JWT_SECRET, { sub: user.id });

  return { authHeader: `Bearer ${token}` };
};

describe("commitment routes", () => {
  it("rejects when the user has no family yet", async () => {
    const app = createApp();
    const userRepository = new DrizzleUserRepository(createDb(env.DB));
    const user = await userRepository.create({ googleId: crypto.randomUUID(), email: "no-family@example.com", name: "NoFam" });
    const token = await signAppJwt(env.JWT_SECRET, { sub: user.id });

    const response = await app.request("/api/v1/commitments", { headers: { Authorization: `Bearer ${token}` } }, env);

    expect(response.status).toBe(400);
  });

  it("creates, lists, updates and archives a commitment end to end", async () => {
    const app = createApp();
    const { authHeader } = await createAuthenticatedUserWithFamily();

    const createResponse = await app.request(
      "/api/v1/commitments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ name: "Arriendo", amountLimit: 800000, dueDay: 5 }),
      },
      env,
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: string; notifyDaysBefore: number }>();
    expect(created.notifyDaysBefore).toBe(3);

    const listResponse = await app.request("/api/v1/commitments", { headers: { Authorization: authHeader } }, env);
    expect(listResponse.status).toBe(200);
    const commitments = await listResponse.json<Array<{ id: string }>>();
    expect(commitments.some((c) => c.id === created.id)).toBe(true);

    const updateResponse = await app.request(
      `/api/v1/commitments/${created.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ amountLimit: 850000 }),
      },
      env,
    );
    expect(updateResponse.status).toBe(200);
    expect((await updateResponse.json<{ amountLimit: number }>()).amountLimit).toBe(850000);

    const archiveResponse = await app.request(
      `/api/v1/commitments/${created.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ archived: true }),
      },
      env,
    );
    expect(archiveResponse.status).toBe(200);
    expect((await archiveResponse.json<{ archivedAt: string | null }>()).archivedAt).not.toBeNull();
  });

  it("rejects creating a commitment with an invalid dueDay", async () => {
    const app = createApp();
    const { authHeader } = await createAuthenticatedUserWithFamily();

    const response = await app.request(
      "/api/v1/commitments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ name: "Arriendo", amountLimit: 800000, dueDay: 40 }),
      },
      env,
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when updating a commitment that doesn't exist", async () => {
    const app = createApp();
    const { authHeader } = await createAuthenticatedUserWithFamily();

    const response = await app.request(
      `/api/v1/commitments/${crypto.randomUUID()}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ amountLimit: 1000 }),
      },
      env,
    );

    expect(response.status).toBe(404);
  });

  it("returns the upcoming commitments within the window", async () => {
    const app = createApp();
    const { authHeader } = await createAuthenticatedUserWithFamily();

    await app.request(
      "/api/v1/commitments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ name: "Arriendo", amountLimit: 800000, dueDay: 28 }),
      },
      env,
    );

    const response = await app.request("/api/v1/commitments/upcoming?withinDays=90", { headers: { Authorization: authHeader } }, env);

    expect(response.status).toBe(200);
    const upcoming = await response.json<Array<{ name: string }>>();
    expect(upcoming.some((c) => c.name === "Arriendo")).toBe(true);
  });

  it("marks a commitment as paid and then unmarks it", async () => {
    const app = createApp();
    const { authHeader } = await createAuthenticatedUserWithFamily();

    const createResponse = await app.request(
      "/api/v1/commitments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ name: "Arriendo", amountLimit: 800000, dueDay: 5 }),
      },
      env,
    );
    const { id } = await createResponse.json<{ id: string }>();

    const payResponse = await app.request(
      `/api/v1/commitments/${id}/payments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ period: "2026-09" }),
      },
      env,
    );
    expect(payResponse.status).toBe(201);

    const unpayResponse = await app.request(
      `/api/v1/commitments/${id}/payments/2026-09`,
      { method: "DELETE", headers: { Authorization: authHeader } },
      env,
    );
    expect(unpayResponse.status).toBe(204);
  });

  it("returns 404 when marking a nonexistent commitment as paid", async () => {
    const app = createApp();
    const { authHeader } = await createAuthenticatedUserWithFamily();

    const response = await app.request(
      `/api/v1/commitments/${crypto.randomUUID()}/payments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ period: "2026-09" }),
      },
      env,
    );

    expect(response.status).toBe(404);
  });
});
