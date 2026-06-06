import { Transaction } from '../models/domain.models';

export interface CategoryExpenseTotal {
  categoryId: string;
  amount: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  expensesByCategory: CategoryExpenseTotal[];
}

export function calculateFinancialSummary(transactions: Transaction[]): FinancialSummary {
  const active = transactions.filter((transaction) => transaction.status === 'active');
  const totalIncome = active
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expenses = active.filter((transaction) => transaction.type === 'expense');
  const totalExpenses = expenses.reduce((total, transaction) => total + transaction.amount, 0);
  const categoryTotals = new Map<string, number>();

  for (const transaction of expenses) {
    if (!transaction.categoryId) {
      continue;
    }
    categoryTotals.set(
      transaction.categoryId,
      (categoryTotals.get(transaction.categoryId) ?? 0) + transaction.amount,
    );
  }

  return {
    totalIncome,
    totalExpenses,
    netFlow: totalIncome - totalExpenses,
    expensesByCategory: [...categoryTotals.entries()]
      .map(([categoryId, amount]) => ({ categoryId, amount }))
      .sort((left, right) => right.amount - left.amount),
  };
}
