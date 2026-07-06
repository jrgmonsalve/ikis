import type { FamilyRepository } from "../../families/domain/family-repository";
import { assertValidDate } from "../domain/budget";
import type { CycleRange } from "../domain/budget";
import type { BudgetRepository } from "../domain/budget-repository";
import { todayIsoDate } from "./ensure-current-cycle-budgets";

type Dependencies = {
  budgetRepository: BudgetRepository;
  familyRepository: FamilyRepository;
};

type DefineCurrentBudgetCycleInput = {
  familyId: string;
  start: string;
  end: string;
  today?: string;
};

export const defineCurrentBudgetCycle = async (
  { budgetRepository, familyRepository }: Dependencies,
  { familyId, start, end, today = todayIsoDate() }: DefineCurrentBudgetCycleInput,
): Promise<CycleRange> => {
  assertValidDate(start);
  assertValidDate(end);
  if (start > end) {
    throw new Error("start must be on or before end");
  }
  if (today < start || today > end) {
    throw new Error("The current cycle must contain today");
  }

  const family = await familyRepository.findById(familyId);
  if (!family) {
    throw new Error("Family not found");
  }

  const active = await budgetRepository.findActiveOn(familyId, today);
  const [activeHead] = active;

  const previousCycleEnd = await budgetRepository.findPreviousCycleEnd(familyId, activeHead?.period ?? today);
  if (previousCycleEnd !== null && start <= previousCycleEnd) {
    throw new Error("The cycle would overlap an already closed cycle");
  }

  await familyRepository.update(familyId, { budgetCycleEndDay: Number(end.slice(8, 10)) });

  if (activeHead) {
    await budgetRepository.redateCycle(familyId, activeHead.period, { start, end });
  }

  return { start, end };
};
