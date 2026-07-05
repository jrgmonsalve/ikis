import type { Category } from "./api";

export type FlatCategory = {
  id: string;
  label: string;
};

export function flattenCategories(categories: Category[]): FlatCategory[] {
  return categories.flatMap((root) => [
    { id: root.id, label: root.name },
    ...root.children.map((child) => ({ id: child.id, label: `${root.name} › ${child.name}` })),
  ]);
}
