import type { BudgetStatus } from "./api";

export function sortBudgetStatusByExecution(budgetStatus: BudgetStatus[]): BudgetStatus[] {
  return budgetStatus
    .map((budget, index) => ({ budget, index }))
    .sort((a, b) => {
      const executionDifference = a.budget.spent / a.budget.amountLimit - b.budget.spent / b.budget.amountLimit;
      if (executionDifference !== 0) {
        return executionDifference;
      }

      const amountLimitDifference = b.budget.amountLimit - a.budget.amountLimit;
      return amountLimitDifference !== 0 ? amountLimitDifference : a.index - b.index;
    })
    .map(({ budget }) => budget);
}

export function sumBudgetAvailable(budgetStatus: BudgetStatus[]): number {
  return budgetStatus.reduce((sum, budget) => sum + (budget.amountLimit - budget.spent), 0);
}

export function calculateUnassignedFunds(assignableFunds: number, budgetStatus: BudgetStatus[]): number {
  return assignableFunds - sumBudgetAvailable(budgetStatus);
}
