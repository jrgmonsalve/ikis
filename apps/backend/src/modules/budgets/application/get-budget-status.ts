import type { FamilyRepository } from "../../families/domain/family-repository";
import { assertValidDate } from "../domain/budget";
import type { BudgetStatus } from "../domain/budget";
import type { BudgetRepository } from "../domain/budget-repository";
import { ensureCurrentCycleBudgets, todayIsoDate } from "./ensure-current-cycle-budgets";

type Dependencies = {
  budgetRepository: BudgetRepository;
  familyRepository: FamilyRepository;
};

type GetBudgetStatusInput = {
  familyId: string;
  /** Any day inside the cycle to read ('YYYY-MM-DD'). */
  date: string;
  today?: string;
};

export const getBudgetStatus = async (
  { budgetRepository, familyRepository }: Dependencies,
  { familyId, date, today = todayIsoDate() }: GetBudgetStatusInput,
): Promise<BudgetStatus[]> => {
  assertValidDate(date);

  const family = await familyRepository.findById(familyId);
  if (!family) {
    throw new Error("Family not found");
  }

  await ensureCurrentCycleBudgets(budgetRepository, familyId, family.budgetCycleEndDay, today);

  return budgetRepository.getStatusActiveOn(familyId, date);
};
