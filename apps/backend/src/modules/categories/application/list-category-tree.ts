import type { CategoryTree } from "../domain/category-tree";
import { buildCategoryTree } from "../domain/category-tree";
import type { CategoryRepository } from "../domain/category-repository";

type Dependencies = {
  categoryRepository: CategoryRepository;
};

export const listCategoryTree = async (
  { categoryRepository }: Dependencies,
  { familyId }: { familyId: string },
): Promise<CategoryTree[]> => {
  const categories = await categoryRepository.findAllByFamily(familyId);
  return buildCategoryTree(categories);
};
