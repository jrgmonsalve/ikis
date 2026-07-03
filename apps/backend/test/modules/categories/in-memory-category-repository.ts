import type { Category } from "../../../src/modules/categories/domain/category";
import type { CategoryRepository, NewCategory } from "../../../src/modules/categories/domain/category-repository";

export class InMemoryCategoryRepository implements CategoryRepository {
  private categories: Category[] = [];

  async findById(familyId: string, id: string) {
    return this.categories.find((category) => category.familyId === familyId && category.id === id) ?? null;
  }

  async findAllByFamily(familyId: string) {
    return this.categories.filter((category) => category.familyId === familyId);
  }

  async create(input: NewCategory) {
    const category: Category = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...input,
    };
    this.categories.push(category);
    return category;
  }

  async update(familyId: string, id: string, changes: { name: string }) {
    const category = await this.findById(familyId, id);
    if (!category) {
      throw new Error("Category not found");
    }
    category.name = changes.name;
    return category;
  }

  async delete(familyId: string, id: string) {
    this.categories = this.categories.filter(
      (category) => !(category.familyId === familyId && (category.id === id || category.parentId === id)),
    );
  }
}
