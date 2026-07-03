import { describe, expect, it } from "vitest";
import { listCategoryTree } from "../../../../src/modules/categories/application/list-category-tree";
import { InMemoryCategoryRepository } from "../in-memory-category-repository";

describe("listCategoryTree", () => {
  it("returns the family's categories nested as a tree", async () => {
    const categoryRepository = new InMemoryCategoryRepository();
    const root = await categoryRepository.create({ familyId: "family-1", parentId: null, name: "food" });
    const child = await categoryRepository.create({ familyId: "family-1", parentId: root.id, name: "grocery" });
    await categoryRepository.create({ familyId: "family-2", parentId: null, name: "transport" });

    const tree = await listCategoryTree({ categoryRepository }, { familyId: "family-1" });

    expect(tree).toEqual([{ ...root, children: [child] }]);
  });
});
