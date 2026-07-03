import { describe, expect, it } from "vitest";
import { copyDefaultCategories } from "../../../../src/modules/categories/application/copy-default-categories";
import { DEFAULT_CATEGORIES } from "../../../../src/modules/categories/domain/default-categories";
import { InMemoryCategoryRepository } from "../in-memory-category-repository";

describe("copyDefaultCategories", () => {
  it("copies every default root and subcategory scoped to the given family", async () => {
    const categoryRepository = new InMemoryCategoryRepository();

    await copyDefaultCategories(categoryRepository, "family-1");

    const categories = await categoryRepository.findAllByFamily("family-1");
    const totalDefaults = DEFAULT_CATEGORIES.reduce((count, category) => count + 1 + category.children.length, 0);
    expect(categories).toHaveLength(totalDefaults);
    expect(categories.every((category) => category.familyId === "family-1")).toBe(true);

    const food = categories.find((category) => category.name === "food" && category.parentId === null);
    expect(food).toBeDefined();
    const grocery = categories.find((category) => category.name === "grocery");
    expect(grocery?.parentId).toBe(food?.id);
  });
});
