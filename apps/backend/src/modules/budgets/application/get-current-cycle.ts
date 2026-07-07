import type { FamilyRepository } from "../../families/domain/family-repository";
import type { CycleRange } from "../domain/budget";
import type { BudgetRepository } from "../domain/budget-repository";
import { ensureCurrentCycleBudgets, todayIsoDate } from "./ensure-current-cycle-budgets";

type Dependencies = {
  budgetRepository: BudgetRepository;
  familyRepository: FamilyRepository;
};

type GetCurrentCycleInput = {
  familyId: string;
  today?: string;
};

export const getCurrentCycle = async (
  { budgetRepository, familyRepository }: Dependencies,
  { familyId, today = todayIsoDate() }: GetCurrentCycleInput,
): Promise<CycleRange> => {
  const family = await familyRepository.findById(familyId);
  if (!family) {
    throw new Error("Family not found");
  }

  const { cycle } = await ensureCurrentCycleBudgets(budgetRepository, familyId, family, today);
  return cycle;
};
