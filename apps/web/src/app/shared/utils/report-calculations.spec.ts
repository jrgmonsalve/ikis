import { Timestamp } from 'firebase/firestore';

import { Transaction } from '../models/domain.models';
import { calculateFinancialSummary } from './report-calculations';

function transaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'transaction',
    familyId: 'family',
    type: 'expense',
    amount: 100,
    currency: 'COP',
    accountId: 'account',
    categoryId: 'food',
    transactionDate: Timestamp.now(),
    createdByUserId: 'user',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    status: 'active',
    source: 'manual',
    ...overrides,
  };
}

describe('report calculations', () => {
  it('excludes transfers and cancelled transactions', () => {
    const summary = calculateFinancialSummary([
      transaction({ id: 'expense', amount: 300 }),
      transaction({ id: 'income', type: 'income', amount: 1_000 }),
      transaction({ id: 'transfer', type: 'transfer', amount: 500 }),
      transaction({ id: 'cancelled', amount: 700, status: 'cancelled' }),
    ]);

    expect(summary.totalIncome).toBe(1_000);
    expect(summary.totalExpenses).toBe(300);
    expect(summary.netFlow).toBe(700);
  });

  it('groups expenses by category', () => {
    const summary = calculateFinancialSummary([
      transaction({ amount: 100, categoryId: 'food' }),
      transaction({ id: 'food-2', amount: 200, categoryId: 'food' }),
      transaction({ id: 'transport', amount: 150, categoryId: 'transport' }),
    ]);

    expect(summary.expensesByCategory).toEqual([
      { categoryId: 'food', amount: 300 },
      { categoryId: 'transport', amount: 150 },
    ]);
  });
});
