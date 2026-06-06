import { Timestamp } from 'firebase/firestore';

import { Budget, Transaction } from '../models/domain.models';
import { calculateBudgetProgress } from './budget-calculations';

const budget: Budget = {
  id: 'budget',
  familyId: 'family',
  name: 'Food',
  categoryId: 'food',
  plannedAmount: 1_000,
  spentAmount: 0,
  remainingAmount: 1_000,
  percentageUsed: 0,
  periodType: 'monthly',
  month: 6,
  year: 2026,
  startDate: Timestamp.fromDate(new Date('2026-06-01T00:00:00Z')),
  endDate: Timestamp.fromDate(new Date('2026-06-30T23:59:59Z')),
  currency: 'COP',
  createdByUserId: 'user',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  status: 'active',
};

function transaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'transaction',
    familyId: 'family',
    type: 'expense',
    amount: 400,
    currency: 'COP',
    accountId: 'account',
    categoryId: 'food',
    transactionDate: Timestamp.fromDate(new Date('2026-06-10T12:00:00Z')),
    createdByUserId: 'user',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    status: 'active',
    source: 'manual',
    ...overrides,
  };
}

describe('budget calculations', () => {
  it('uses only matching active expenses inside the period', () => {
    const result = calculateBudgetProgress(budget, [
      transaction({ amount: 400 }),
      transaction({ id: 'income', type: 'income', amount: 900 }),
      transaction({ id: 'other-category', categoryId: 'transport', amount: 300 }),
      transaction({
        id: 'outside',
        amount: 200,
        transactionDate: Timestamp.fromDate(new Date('2026-07-01T00:00:00Z')),
      }),
    ]);

    expect(result).toEqual({
      spentAmount: 400,
      remainingAmount: 600,
      percentageUsed: 40,
      exceeded: false,
    });
  });

  it('marks an exceeded budget', () => {
    const result = calculateBudgetProgress(budget, [transaction({ amount: 1_250 })]);

    expect(result.exceeded).toBe(true);
    expect(result.remainingAmount).toBe(-250);
    expect(result.percentageUsed).toBe(125);
  });
});
