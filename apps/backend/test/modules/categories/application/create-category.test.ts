import { describe, expect, it } from "vitest";
import { createCategory } from "../../../../src/modules/categories/application/create-category";
import { InMemoryCategoryRepository } from "../in-memory-category-repository";

describe("createCategory", () => {
  it("creates a root category", async () => {
    const categoryRepository = new InMemoryCategoryRepository();

    const category = await createCategory(
      { categoryRepository },
      { familyId: "family-1", parentId: null, name: "food" },
    );

    expect(category.name).toBe("food");
    expect(category.parentId).toBeNull();
  });

  it("creates a subcategory under a root category", async () => {
    const categoryRepository = new InMemoryCategoryRepository();
    const parent = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });

    const subcategory = await createCategory(
      { categoryRepository },
      { familyId: "family-1", parentId: parent.id, name: "grocery" },
    );

    expect(subcategory.parentId).toBe(parent.id);
  });

  it("rejects a subcategory whose parent is itself a subcategory", async () => {
    const categoryRepository = new InMemoryCategoryRepository();
    const root = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    const subcategory = await categoryRepository.create({
      familyId: "family-1",
      parentId: root.id,
      name: "grocery",
    });

    await expect(
      createCategory(
        { categoryRepository },
        { familyId: "family-1", parentId: subcategory.id, name: "organic grocery" },
      ),
    ).rejects.toThrow("A subcategory cannot have children");
  });

  it("rejects creating a subcategory under a parent from another family", async () => {
    const categoryRepository = new InMemoryCategoryRepository();
    const parent = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });

    await expect(
      createCategory(
        { categoryRepository },
        { familyId: "family-2", parentId: parent.id, name: "grocery" },
      ),
    ).rejects.toThrow("Parent category not found");
  });
});
