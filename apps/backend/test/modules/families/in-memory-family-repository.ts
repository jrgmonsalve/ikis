import type { Family } from "../../../src/modules/families/domain/family";
import type { FamilyChanges, FamilyRepository, NewFamily } from "../../../src/modules/families/domain/family-repository";

export class InMemoryFamilyRepository implements FamilyRepository {
  families: Family[] = [];

  async findById(id: string) {
    return this.families.find((family) => family.id === id) ?? null;
  }

  async create(input: NewFamily) {
    const family: Family = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      budgetCycleEndDay: 31,
      definedCycleStart: null,
      definedCycleEnd: null,
      ...input,
    };
    this.families.push(family);
    return family;
  }

  async update(id: string, changes: FamilyChanges) {
    const family = await this.findById(id);
    if (!family) {
      throw new Error("Family not found");
    }
    if (changes.budgetCycleEndDay !== undefined) {
      family.budgetCycleEndDay = changes.budgetCycleEndDay;
    }
    if (changes.definedCycleStart !== undefined) {
      family.definedCycleStart = changes.definedCycleStart;
    }
    if (changes.definedCycleEnd !== undefined) {
      family.definedCycleEnd = changes.definedCycleEnd;
    }
    return family;
  }
}
