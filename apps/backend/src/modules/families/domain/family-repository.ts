import type { Family } from "./family";

export type NewFamily = {
  name: string;
};

export type FamilyChanges = {
  budgetCycleStartDay?: number;
};

export interface FamilyRepository {
  findById(id: string): Promise<Family | null>;
  create(family: NewFamily): Promise<Family>;
  update(id: string, changes: FamilyChanges): Promise<Family>;
}
