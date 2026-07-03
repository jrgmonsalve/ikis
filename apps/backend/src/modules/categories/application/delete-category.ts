import type { CategoryRepository } from "../domain/category-repository";

type Dependencies = {
  categoryRepository: CategoryRepository;
};

type DeleteCategoryInput = {
  familyId: string;
  id: string;
};

export const deleteCategory = async (
  { categoryRepository }: Dependencies,
  { familyId, id }: DeleteCategoryInput,
): Promise<void> => {
  const existing = await categoryRepository.findById(familyId, id);
  if (!existing) {
    throw new Error("Category not found");
  }

  await categoryRepository.delete(familyId, id);
};
