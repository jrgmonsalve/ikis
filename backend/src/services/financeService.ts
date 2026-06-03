import { randomUUID } from 'node:crypto';
import type {
  Account,
  AccountInput,
  AccountUpdateInput,
  Category,
  CategoryInput,
  CategoryUpdateInput,
  FinancialTransaction,
  TransactionInput
} from '../models/finance.js';
import { FinanceRepository } from '../repositories/financeRepository.js';

export class FinanceService {
  constructor(private readonly repository: FinanceRepository) {}

  async createAccount(userId: string, input: AccountInput): Promise<Account> {
    validateAccountInput(input);

    const now = new Date().toISOString();
    return this.repository.putAccount({
      id: randomUUID(),
      userId,
      name: input.name.trim(),
      type: input.type,
      currency: input.currency.trim().toUpperCase(),
      balance: input.balance,
      createdAt: now,
      updatedAt: now
    });
  }

  async listAccounts(userId: string): Promise<Account[]> {
    return this.repository.listAccounts(userId);
  }

  async updateAccount(userId: string, id: string, input: AccountUpdateInput): Promise<Account | null> {
    const existing = await this.repository.getAccount(userId, id);
    if (!existing) {
      return null;
    }

    validateAccountUpdateInput(input);

    return this.repository.putAccount({
      ...existing,
      ...input,
      name: input.name?.trim() ?? existing.name,
      currency: input.currency?.trim().toUpperCase() ?? existing.currency,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteAccount(userId: string, id: string): Promise<boolean> {
    const existing = await this.repository.getAccount(userId, id);
    if (!existing) {
      return false;
    }

    await this.repository.deleteAccount(userId, id);
    return true;
  }

  async createCategory(userId: string, input: CategoryInput): Promise<Category> {
    validateCategoryInput(input);

    const now = new Date().toISOString();
    return this.repository.putCategory({
      id: randomUUID(),
      userId,
      name: input.name.trim(),
      kind: input.kind,
      color: normalizeColor(input.color),
      createdAt: now,
      updatedAt: now
    });
  }

  async listCategories(userId: string): Promise<Category[]> {
    return this.repository.listCategories(userId);
  }

  async updateCategory(userId: string, id: string, input: CategoryUpdateInput): Promise<Category | null> {
    const existing = await this.repository.getCategory(userId, id);
    if (!existing) {
      return null;
    }

    validateCategoryUpdateInput(input);

    return this.repository.putCategory({
      ...existing,
      ...input,
      name: input.name?.trim() ?? existing.name,
      color: input.color ? normalizeColor(input.color) : existing.color,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteCategory(userId: string, id: string): Promise<boolean> {
    const existing = await this.repository.getCategory(userId, id);
    if (!existing) {
      return false;
    }

    await this.repository.deleteCategory(userId, id);
    return true;
  }

  async createTransaction(userId: string, input: TransactionInput): Promise<FinancialTransaction> {
    validateTransactionInput(input);
    await this.applyTransactionBalance(userId, input);

    const now = new Date().toISOString();
    return this.repository.putTransaction({
      id: randomUUID(),
      userId,
      type: input.type,
      amount: input.amount,
      categoryId: input.categoryId,
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      transactionDate: input.transactionDate,
      description: input.description?.trim(),
      createdAt: now,
      updatedAt: now
    });
  }

  async listTransactions(userId: string): Promise<FinancialTransaction[]> {
    return this.repository.listTransactions(userId);
  }

  private async applyTransactionBalance(userId: string, input: TransactionInput): Promise<void> {
    if (input.type === 'expense') {
      await this.adjustAccountBalance(userId, input.fromAccountId, -input.amount);
      return;
    }

    if (input.type === 'income') {
      await this.adjustAccountBalance(userId, input.toAccountId, input.amount);
      return;
    }

    await this.adjustAccountBalance(userId, input.fromAccountId, -input.amount);
    await this.adjustAccountBalance(userId, input.toAccountId, input.amount);
  }

  private async adjustAccountBalance(userId: string, accountId: string | undefined, delta: number): Promise<void> {
    if (!accountId) {
      throw new Error('Account is required.');
    }

    const account = await this.repository.getAccount(userId, accountId);
    if (!account) {
      throw new Error('Account not found.');
    }

    await this.repository.putAccount({
      ...account,
      balance: roundMoney(account.balance + delta),
      updatedAt: new Date().toISOString()
    });
  }
}

function validateAccountInput(input: AccountInput): void {
  if (!input.name?.trim()) {
    throw new Error('Account name is required.');
  }

  if (!['cash', 'checking', 'savings', 'credit'].includes(input.type)) {
    throw new Error('Account type is invalid.');
  }

  if (!input.currency?.trim()) {
    throw new Error('Account currency is required.');
  }

  if (!Number.isFinite(input.balance)) {
    throw new Error('Account balance must be a valid number.');
  }
}

function validateAccountUpdateInput(input: AccountUpdateInput): void {
  validateAccountInput({
    name: input.name ?? 'Valid',
    type: input.type ?? 'cash',
    currency: input.currency ?? 'USD',
    balance: input.balance ?? 0
  });
}

function validateCategoryInput(input: CategoryInput): void {
  if (!input.name?.trim()) {
    throw new Error('Category name is required.');
  }

  if (!['expense', 'income'].includes(input.kind)) {
    throw new Error('Category kind is invalid.');
  }
}

function validateCategoryUpdateInput(input: CategoryUpdateInput): void {
  if (input.name !== undefined && !input.name.trim()) {
    throw new Error('Category name is required.');
  }

  if (input.kind !== undefined && !['expense', 'income'].includes(input.kind)) {
    throw new Error('Category kind is invalid.');
  }
}

function validateTransactionInput(input: TransactionInput): void {
  if (!['expense', 'income', 'transfer'].includes(input.type)) {
    throw new Error('Transaction type is invalid.');
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Transaction amount must be greater than zero.');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.transactionDate)) {
    throw new Error('Transaction date must use YYYY-MM-DD format.');
  }

  if ((input.type === 'expense' || input.type === 'income') && !input.categoryId) {
    throw new Error('Category is required for income and expense transactions.');
  }

  if (input.type === 'expense' && !input.fromAccountId) {
    throw new Error('Origin account is required for expenses.');
  }

  if (input.type === 'income' && !input.toAccountId) {
    throw new Error('Destination account is required for income.');
  }

  if (input.type === 'transfer') {
    if (!input.fromAccountId || !input.toAccountId) {
      throw new Error('Origin and destination accounts are required for transfers.');
    }

    if (input.fromAccountId === input.toAccountId) {
      throw new Error('Transfer accounts must be different.');
    }
  }
}

function normalizeColor(color: string): string {
  return color?.trim() || '#0f766e';
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
