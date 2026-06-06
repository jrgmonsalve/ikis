import { Budget, Transaction } from '../models/domain.models';

export interface BudgetProgress {
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  exceeded: boolean;
}

export function calculateBudgetProgress(
  budget: Budget,
  transactions: Transaction[],
): BudgetProgress {
  const start = budget.startDate.toMillis();
  const end = budget.endDate.toMillis();
  const spentAmount = transactions
    .filter(
      (transaction) =>
        transaction.status === 'active' &&
        transaction.type === 'expense' &&
        transaction.categoryId === budget.categoryId &&
        transaction.transactionDate.toMillis() >= start &&
        transaction.transactionDate.toMillis() <= end,
    )
    .reduce((total, transaction) => total + transaction.amount, 0);

  return {
    spentAmount,
    remainingAmount: budget.plannedAmount - spentAmount,
    percentageUsed:
      budget.plannedAmount > 0 ? Math.round((spentAmount / budget.plannedAmount) * 100) : 0,
    exceeded: spentAmount > budget.plannedAmount,
  };
}
