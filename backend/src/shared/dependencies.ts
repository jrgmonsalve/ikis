import { ExpenseRepository } from '../repositories/expenseRepository.js';
import { ExpenseService } from '../services/expenseService.js';
import { config } from './config.js';

export function createExpenseService(): ExpenseService {
  if (!config.expensesTableName) {
    throw new Error('EXPENSES_TABLE_NAME is required.');
  }

  return new ExpenseService(new ExpenseRepository(config.expensesTableName));
}
