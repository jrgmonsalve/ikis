import { assertValidPeriod, toStoragePeriod } from "../domain/budget";
import type { BudgetStatus } from "../domain/budget";
import type { BudgetRepository } from "../domain/budget-repository";

type Dependencies = {
  budgetRepository: BudgetRepository;
};

type GetBudgetStatusInput = {
  familyId: string;
  /** Public format: 'YYYY-MM'. */
  period: string;
};

export const getBudgetStatus = async (
  { budgetRepository }: Dependencies,
  { familyId, period }: GetBudgetStatusInput,
): Promise<BudgetStatus[]> => {
  assertValidPeriod(period);
  return budgetRepository.getStatusForPeriod(familyId, toStoragePeriod(period));
};
