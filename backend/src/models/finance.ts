export type AccountType = 'cash' | 'checking' | 'savings' | 'credit';
export type CategoryKind = 'expense' | 'income';
export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccountInput {
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
}

export interface AccountUpdateInput {
  name?: string;
  type?: AccountType;
  currency?: string;
  balance?: number;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  kind: CategoryKind;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInput {
  name: string;
  kind: CategoryKind;
  color: string;
}

export interface CategoryUpdateInput {
  name?: string;
  kind?: CategoryKind;
  color?: string;
}

export interface FinancialTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  transactionDate: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  categoryId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  transactionDate: string;
  description?: string;
}
