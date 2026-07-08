import type { BudgetStatus } from "./api";

export function sumBudgetAvailable(budgetStatus: BudgetStatus[]): number {
  return budgetStatus.reduce((sum, budget) => sum + (budget.amountLimit - budget.spent), 0);
}

export function calculateUnassignedFunds(assignableFunds: number, budgetStatus: BudgetStatus[]): number {
  return assignableFunds - sumBudgetAvailable(budgetStatus);
}
