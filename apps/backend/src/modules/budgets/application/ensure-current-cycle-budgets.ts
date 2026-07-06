import { cycleContaining, nextCycleAfter } from "../domain/budget";
import type { Budget, CycleRange } from "../domain/budget";
import type { BudgetRepository } from "../domain/budget-repository";

export const todayIsoDate = (): string => new Date().toISOString().slice(0, 10);

/**
 * Resolves the cycle that contains `today` and rolls the latest stored budgets
 * forward into it when it has none yet. Stored cycles are never rewritten: a
 * cycle materialized before a settings change keeps its dates, and the new
 * cycleEndDay only shapes cycles created after the last stored one.
 */
export const ensureCurrentCycleBudgets = async (
  budgetRepository: BudgetRepository,
  familyId: string,
  cycleEndDay: number,
  today: string,
): Promise<{ cycle: CycleRange; budgets: Budget[] }> => {
  const active = await budgetRepository.findActiveOn(familyId, today);
  const [activeHead] = active;
  if (activeHead) {
    return { cycle: { start: activeHead.period, end: activeHead.periodEnd }, budgets: active };
  }

  const latestCycle = await budgetRepository.findLatestCycle(familyId);
  const [latestHead] = latestCycle;

  let cycle = latestHead ? nextCycleAfter(cycleEndDay, latestHead.periodEnd) : cycleContaining(cycleEndDay, today);
  while (cycle.end < today) {
    cycle = nextCycleAfter(cycleEndDay, cycle.end);
  }

  if (latestCycle.length === 0) {
    return { cycle, budgets: [] };
  }

  await budgetRepository.createMany(
    latestCycle.map((budget) => ({
      familyId,
      categoryId: budget.categoryId,
      period: cycle.start,
      periodEnd: cycle.end,
      amountLimit: budget.amountLimit,
    })),
  );

  return { cycle, budgets: await budgetRepository.findActiveOn(familyId, today) };
};
