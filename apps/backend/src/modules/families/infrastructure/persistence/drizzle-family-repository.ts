import type { Db } from "../../../../shared/db";
import type { Family } from "../../domain/family";
import type { FamilyRepository, NewFamily } from "../../domain/family-repository";
import { families } from "./families.schema";

export class DrizzleFamilyRepository implements FamilyRepository {
  constructor(private readonly db: Db) {}

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
