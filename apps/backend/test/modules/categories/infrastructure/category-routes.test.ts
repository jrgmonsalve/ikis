import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createDb } from "../../../../src/shared/db";
import { createApp } from "../../../../src/app";
import { DrizzleFamilyRepository } from "../../../../src/modules/families/infrastructure/persistence/drizzle-family-repository";
import { DrizzleUserRepository } from "../../../../src/modules/users/infrastructure/persistence/drizzle-user-repository";
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

describe("category routes", () => {
  it("rejects when the user has no family yet", async () => {
    const app = createApp();
    const userRepository = new DrizzleUserRepository(createDb(env.DB));
    const user = await userRepository.create({
      googleId: crypto.randomUUID(),
      email: "no-family@example.com",
      name: "NoFam",
    });
    const token = await signAppJwt(env.JWT_SECRET, { sub: user.id });

    const response = await app.request("/categories", { headers: { Authorization: `Bearer ${token}` } }, env);

    expect(response.status).toBe(400);
  });

  it("creates, lists, renames, and deletes a category end to end", async () => {
    const app = createApp();
    const { authHeader } = await createAuthenticatedUserWithFamily();

    const createResponse = await app.request(
      "/categories",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ name: "food", parentId: null }),
      },
      env,
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: string; name: string }>();

    const listResponse = await app.request("/categories", { headers: { Authorization: authHeader } }, env);
    expect(listResponse.status).toBe(200);
    const tree = await listResponse.json<Array<{ id: string }>>();
    expect(tree.some((category) => category.id === created.id)).toBe(true);

    const renameResponse = await app.request(
      `/categories/${created.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ name: "groceries" }),
      },
      env,
    );
    expect(renameResponse.status).toBe(200);
    const renamed = await renameResponse.json<{ name: string }>();
    expect(renamed.name).toBe("groceries");

    const deleteResponse = await app.request(
      `/categories/${created.id}`,
      { method: "DELETE", headers: { Authorization: authHeader } },
      env,
    );
    expect(deleteResponse.status).toBe(204);
  });

  it("rejects a subcategory under an already-nested category", async () => {
    const app = createApp();
    const { authHeader } = await createAuthenticatedUserWithFamily();

    const rootResponse = await app.request(
      "/categories",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ name: "food", parentId: null }),
      },
      env,
    );
    const root = await rootResponse.json<{ id: string }>();
    const childResponse = await app.request(
      "/categories",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ name: "grocery", parentId: root.id }),
      },
      env,
    );
    const child = await childResponse.json<{ id: string }>();

    const grandchildResponse = await app.request(
      "/categories",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ name: "organic", parentId: child.id }),
      },
      env,
    );

    expect(grandchildResponse.status).toBe(400);
  });
});
