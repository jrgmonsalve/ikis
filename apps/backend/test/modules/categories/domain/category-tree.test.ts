import { describe, expect, it } from "vitest";
import { buildCategoryTree } from "../../../../src/modules/categories/domain/category-tree";
import type { Category } from "../../../../src/modules/categories/domain/category";

const buildCategory = (overrides: Partial<Category>): Category => ({
  id: "category-1",
  familyId: "family-1",
  parentId: null,
  name: "food",
  createdAt: new Date(),
  ...overrides,
});

describe("buildCategoryTree", () => {
  it("nests subcategories under their parent", () => {
    const food = buildCategory({ id: "food", name: "food", parentId: null });
    const fastFood = buildCategory({ id: "fast-food", name: "fast food", parentId: "food" });
    const grocery = buildCategory({ id: "grocery", name: "grocery", parentId: "food" });
    const health = buildCategory({ id: "health", name: "health", parentId: null });

    const tree = buildCategoryTree([food, fastFood, grocery, health]);

    expect(tree).toEqual([
      { ...food, children: [fastFood, grocery] },
      { ...health, children: [] },
    ]);
  });

  it("returns an empty list when there are no categories", () => {
    expect(buildCategoryTree([])).toEqual([]);
  });
});
