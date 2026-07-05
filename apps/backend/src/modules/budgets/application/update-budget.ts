import { assertValidAmountLimit } from "../domain/budget";
import type { Budget } from "../domain/budget";
import type { BudgetChanges, BudgetRepository } from "../domain/budget-repository";

type Dependencies = {
  budgetRepository: BudgetRepository;
};

type UpdateBudgetInput = {
  familyId: string;
  id: string;
  changes: BudgetChanges;
};

export const updateBudget = async (
  { budgetRepository }: Dependencies,
  { familyId, id, changes }: UpdateBudgetInput,
): Promise<Budget> => {
  const existing = await budgetRepository.findById(familyId, id);
  if (!existing) {
    throw new Error("Budget not found");
  }

  if (changes.amountLimit !== undefined) {
    assertValidAmountLimit(changes.amountLimit);
  }

  return budgetRepository.update(familyId, id, changes);
};
