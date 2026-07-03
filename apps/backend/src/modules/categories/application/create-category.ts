import { assertCanBeParent } from "../domain/category";
import type { Category } from "../domain/category";
import type { CategoryRepository, NewCategory } from "../domain/category-repository";

type Dependencies = {
  categoryRepository: CategoryRepository;
};

export const createCategory = async ({ categoryRepository }: Dependencies, input: NewCategory): Promise<Category> => {
  if (input.parentId) {
    const parent = await categoryRepository.findById(input.familyId, input.parentId);
    if (!parent) {
      throw new Error("Parent category not found");
    }
    assertCanBeParent(parent);
  }

  return categoryRepository.create(input);
};
