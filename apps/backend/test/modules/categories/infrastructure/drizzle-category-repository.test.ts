import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createDb } from "../../../../src/shared/db";
import { DrizzleCategoryRepository } from "../../../../src/modules/categories/infrastructure/persistence/drizzle-category-repository";

describe("DrizzleCategoryRepository", () => {
  it("creates a root category and a subcategory", async () => {
    const repository = new DrizzleCategoryRepository(createDb(env.DB));
    const familyId = crypto.randomUUID();

    const root = await repository.create({ familyId, parentId: null, name: "food" });
    const child = await repository.create({ familyId, parentId: root.id, name: "grocery" });

    expect(child.parentId).toBe(root.id);
  });

  it("finds a category scoped to its family", async () => {
    const repository = new DrizzleCategoryRepository(createDb(env.DB));
    const familyId = crypto.randomUUID();
    const otherFamilyId = crypto.randomUUID();
    const created = await repository.create({ familyId, parentId: null, name: "food" });

    expect(await repository.findById(familyId, created.id)).toEqual(created);
    expect(await repository.findById(otherFamilyId, created.id)).toBeNull();
  });

  it("lists all categories for a family only", async () => {
    const repository = new DrizzleCategoryRepository(createDb(env.DB));
    const familyId = crypto.randomUUID();
    const otherFamilyId = crypto.randomUUID();
    await repository.create({ familyId, parentId: null, name: "food" });
    await repository.create({ familyId: otherFamilyId, parentId: null, name: "transport" });

    const categories = await repository.findAllByFamily(familyId);

    expect(categories).toHaveLength(1);
    expect(categories[0]?.name).toBe("food");
  });

  it("updates a category's name", async () => {
    const repository = new DrizzleCategoryRepository(createDb(env.DB));
    const familyId = crypto.randomUUID();
    const created = await repository.create({ familyId, parentId: null, name: "food" });

    const updated = await repository.update(familyId, created.id, { name: "groceries" });

    expect(updated.name).toBe("groceries");
  });

  it("deletes a category and cascades to its subcategories", async () => {
    const repository = new DrizzleCategoryRepository(createDb(env.DB));
    const familyId = crypto.randomUUID();
    const root = await repository.create({ familyId, parentId: null, name: "food" });
    const child = await repository.create({ familyId, parentId: root.id, name: "grocery" });

    await repository.delete(familyId, root.id);

    expect(await repository.findById(familyId, root.id)).toBeNull();
    expect(await repository.findById(familyId, child.id)).toBeNull();
  });
});
