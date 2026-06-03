import { randomUUID } from 'node:crypto';
import type { Expense, ExpenseInput, ExpenseUpdateInput } from '../models/expense.js';
import { ExpenseRepository } from '../repositories/expenseRepository.js';
import { validateExpenseInput, validateExpenseUpdateInput } from '../shared/validation.js';

export class ExpenseService {
  constructor(private readonly repository: ExpenseRepository) {}

  async create(userId: string, input: ExpenseInput): Promise<Expense> {
    validateExpenseInput(input);

    const now = new Date().toISOString();
    const expense: Expense = {
      id: randomUUID(),
      userId,
      amount: input.amount,
      category: input.category.trim(),
      description: input.description?.trim(),
      expenseDate: input.expenseDate,
      createdAt: now,
      updatedAt: now
    };

    return this.repository.create(expense);
  }

  async get(userId: string, id: string): Promise<Expense | null> {
    return this.repository.get(userId, id);
  }

  async list(userId: string): Promise<Expense[]> {
    return this.repository.listByUser(userId);
  }

  async update(userId: string, id: string, input: ExpenseUpdateInput): Promise<Expense | null> {
    validateExpenseUpdateInput(input);

    const existing = await this.repository.get(userId, id);
    if (!existing) {
      return null;
    }

    const updated: Expense = {
      ...existing,
      ...input,
      category: input.category?.trim() ?? existing.category,
      description: input.description?.trim() ?? existing.description,
      updatedAt: new Date().toISOString()
    };

    return this.repository.update(updated, existing.expenseDate);
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const existing = await this.repository.get(userId, id);
    if (!existing) {
      return false;
    }

    await this.repository.delete(userId, existing.expenseDate, id);
    return true;
  }
}
