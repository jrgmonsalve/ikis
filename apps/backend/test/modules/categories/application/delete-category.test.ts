import { describe, expect, it } from "vitest";
import { deleteCategory } from "../../../../src/modules/categories/application/delete-category";
import { InMemoryCategoryRepository } from "../in-memory-category-repository";

describe("deleteCategory", () => {
  it("deletes a category and its subcategories", async () => {
    const categoryRepository = new InMemoryCategoryRepository();
    const root = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    await categoryRepository.create({ familyId: "family-1", parentId: root.id, name: "grocery" });

    await deleteCategory({ categoryRepository }, { familyId: "family-1", id: root.id });

    expect(await categoryRepository.findAllByFamily("family-1")).toEqual([]);
  });

  it("throws when the category does not belong to the family", async () => {
    const categoryRepository = new InMemoryCategoryRepository();
    const root = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });

    await expect(deleteCategory({ categoryRepository }, { familyId: "family-2", id: root.id })).rejects.toThrow(
      "Category not found",
    );
  });
});
