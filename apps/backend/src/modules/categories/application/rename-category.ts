import type { Category } from "../domain/category";
import type { CategoryRepository } from "../domain/category-repository";

type Dependencies = {
  categoryRepository: CategoryRepository;
};

type RenameCategoryInput = {
  familyId: string;
  id: string;
  name: string;
};

export const renameCategory = async (
  { categoryRepository }: Dependencies,
  { familyId, id, name }: RenameCategoryInput,
): Promise<Category> => {
  const existing = await categoryRepository.findById(familyId, id);
  if (!existing) {
    throw new Error("Category not found");
  }

  return categoryRepository.update(familyId, id, { name });
};
