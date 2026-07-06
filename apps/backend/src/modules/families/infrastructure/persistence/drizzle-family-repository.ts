import { eq } from "drizzle-orm";
import type { Db } from "../../../../shared/db";
import type { Family } from "../../domain/family";
import type { FamilyChanges, FamilyRepository, NewFamily } from "../../domain/family-repository";
import { families } from "./families.schema";

export class DrizzleFamilyRepository implements FamilyRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<Family | null> {
    const [row] = await this.db.select().from(families).where(eq(families.id, id)).limit(1);
    return row ?? null;
  }

  async create(input: NewFamily): Promise<Family> {
    const row: Family = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      budgetCycleEndDay: 31,
      ...input,
    };

    await this.db.insert(families).values(row);

    return row;
  }

  async update(id: string, changes: FamilyChanges): Promise<Family> {
    await this.db.update(families).set(changes).where(eq(families.id, id));

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Family not found");
    }

    return updated;
  }
}
