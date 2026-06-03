export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description?: string;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseInput {
  amount: number;
  category: string;
  description?: string;
  expenseDate: string;
}

export interface ExpenseUpdateInput {
  amount?: number;
  category?: string;
  description?: string;
  expenseDate?: string;
}
