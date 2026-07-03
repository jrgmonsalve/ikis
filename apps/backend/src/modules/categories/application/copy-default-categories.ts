import { DEFAULT_CATEGORIES } from "../domain/default-categories";
import type { CategoryRepository } from "../domain/category-repository";

export const copyDefaultCategories = async (categoryRepository: CategoryRepository, familyId: string): Promise<void> => {
  for (const defaultCategory of DEFAULT_CATEGORIES) {
    const root = await categoryRepository.create({ familyId, parentId: null, name: defaultCategory.name });

    for (const childName of defaultCategory.children) {
      await categoryRepository.create({ familyId, parentId: root.id, name: childName });
    }
  }
};
