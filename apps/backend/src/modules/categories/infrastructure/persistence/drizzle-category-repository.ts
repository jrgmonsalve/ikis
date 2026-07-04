import { and, eq } from "drizzle-orm";
import type { Db } from "../../../../shared/db";
import type { Category } from "../../domain/category";
import type { CategoryRepository, NewCategory } from "../../domain/category-repository";
import { categories } from "./categories.schema";

export class DrizzleCategoryRepository implements CategoryRepository {
  constructor(private readonly db: Db) {}

  async findById(familyId: string, id: string): Promise<Category | null> {
    const [row] = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.familyId, familyId), eq(categories.id, id)))
      .limit(1);
    return row ?? null;
  }

  async findAllByFamily(familyId: string): Promise<Category[]> {
    return this.db.select().from(categories).where(eq(categories.familyId, familyId));
  }

  async create(input: NewCategory): Promise<Category> {
    const row: Category = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...input,
    };

    await this.db.insert(categories).values(row);

    return row;
  }

  async update(familyId: string, id: string, changes: { name: string }): Promise<Category> {
    await this.db
      .update(categories)
      .set({ name: changes.name })
      .where(and(eq(categories.familyId, familyId), eq(categories.id, id)));

    const updated = await this.findById(familyId, id);
    if (!updated) {
      throw new Error("Category not found");
    }

    return updated;
  }

  async delete(familyId: string, id: string): Promise<void> {
    await this.db.delete(categories).where(and(eq(categories.familyId, familyId), eq(categories.id, id)));
  }
}
