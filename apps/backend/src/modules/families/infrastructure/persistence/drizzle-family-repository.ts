import { drizzle } from "drizzle-orm/d1";
import type { Family } from "../../domain/family";
import type { FamilyRepository, NewFamily } from "../../domain/family-repository";
import { families } from "./families.schema";

export class DrizzleFamilyRepository implements FamilyRepository {
  private readonly db: ReturnType<typeof drizzle>;

  constructor(d1: D1Database) {
    this.db = drizzle(d1);
  }

  async create(input: NewFamily): Promise<Family> {
    const row: Family = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...input,
    };

    await this.db.insert(families).values(row);

    return row;
  }
}
