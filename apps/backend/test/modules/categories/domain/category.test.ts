import { describe, expect, it } from "vitest";
import { assertCanBeParent } from "../../../../src/modules/categories/domain/category";
import type { Category } from "../../../../src/modules/categories/domain/category";

const buildCategory = (overrides: Partial<Category> = {}): Category => ({
  id: "category-1",
  familyId: "family-1",
  parentId: null,
  name: "food",
  createdAt: new Date(),
  ...overrides,
});

describe("assertCanBeParent", () => {
  it("does not throw for a root category", () => {
    expect(() => assertCanBeParent(buildCategory({ parentId: null }))).not.toThrow();
  });

  it("throws when the category is already a subcategory", () => {
    expect(() => assertCanBeParent(buildCategory({ parentId: "another-category" }))).toThrow(
      "A subcategory cannot have children",
    );
  });
});
