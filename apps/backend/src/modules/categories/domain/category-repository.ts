import type { Category } from "./category";

export type NewCategory = {
  familyId: string;
  parentId: string | null;
  name: string;
};

export interface CategoryRepository {
  findById(familyId: string, id: string): Promise<Category | null>;
  findAllByFamily(familyId: string): Promise<Category[]>;
  create(category: NewCategory): Promise<Category>;
  update(familyId: string, id: string, changes: { name: string }): Promise<Category>;
  delete(familyId: string, id: string): Promise<void>;
}
