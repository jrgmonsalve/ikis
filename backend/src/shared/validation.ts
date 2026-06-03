import type { ExpenseInput, ExpenseUpdateInput } from '../models/expense.js';

export function validateExpenseInput(input: ExpenseInput): void {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Expense amount must be greater than zero.');
  }

  if (!input.category?.trim()) {
    throw new Error('Expense category is required.');
  }

  if (!isIsoDate(input.expenseDate)) {
    throw new Error('Expense date must use YYYY-MM-DD format.');
  }
}

export function validateExpenseUpdateInput(input: ExpenseUpdateInput): void {
  if (input.amount !== undefined && (!Number.isFinite(input.amount) || input.amount <= 0)) {
    throw new Error('Expense amount must be greater than zero.');
  }

  if (input.category !== undefined && !input.category.trim()) {
    throw new Error('Expense category is required.');
  }

  if (input.expenseDate !== undefined && !isIsoDate(input.expenseDate)) {
    throw new Error('Expense date must use YYYY-MM-DD format.');
  }
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
