import type { Category } from "./category";

export type CategoryTree = Category & { children: Category[] };

export const buildCategoryTree = (categories: Category[]): CategoryTree[] => {
  const childrenByParentId = new Map<string, Category[]>();

  for (const category of categories) {
    if (category.parentId === null) {
      continue;
    }
    const siblings = childrenByParentId.get(category.parentId) ?? [];
    siblings.push(category);
    childrenByParentId.set(category.parentId, siblings);
  }

  return categories
    .filter((category) => category.parentId === null)
    .map((root) => ({
      ...root,
      children: childrenByParentId.get(root.id) ?? [],
    }));
};
