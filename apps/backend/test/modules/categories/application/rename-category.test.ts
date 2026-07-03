import { describe, expect, it } from "vitest";
import { renameCategory } from "../../../../src/modules/categories/application/rename-category";
import { InMemoryCategoryRepository } from "../in-memory-category-repository";

describe("renameCategory", () => {
  it("renames a category owned by the family", async () => {
    const categoryRepository = new InMemoryCategoryRepository();
    const category = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });

    const renamed = await renameCategory(
      { categoryRepository },
      { familyId: "family-1", id: category.id, name: "groceries" },
    );

    expect(renamed.name).toBe("groceries");
  });

  it("throws when the category does not belong to the family", async () => {
    const categoryRepository = new InMemoryCategoryRepository();
    const category = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });

    await expect(
      renameCategory({ categoryRepository }, { familyId: "family-2", id: category.id, name: "groceries" }),
    ).rejects.toThrow("Category not found");
  });
});
