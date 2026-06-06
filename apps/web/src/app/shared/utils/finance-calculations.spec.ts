import { Timestamp } from 'firebase/firestore';

import { Account } from '../models/domain.models';
import { calculateAvailableBalance, calculateCreditCardDebt } from './finance-calculations';

const baseAccount: Account = {
  id: 'account',
  familyId: 'family',
  name: 'Account',
  type: 'cash',
  initialBalance: 0,
  currentBalance: 0,
  currency: 'COP',
  createdByUserId: 'user',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  status: 'active',
};

describe('finance calculations', () => {
  it('excludes credit cards and inactive accounts from available balance', () => {
    const accounts: Account[] = [
      { ...baseAccount, id: 'cash', currentBalance: 100_000 },
      { ...baseAccount, id: 'wallet', type: 'digital_wallet', currentBalance: 50_000 },
      { ...baseAccount, id: 'card', type: 'credit_card', currentBalance: 40_000 },
      { ...baseAccount, id: 'inactive', currentBalance: 20_000, status: 'inactive' },
    ];

    expect(calculateAvailableBalance(accounts)).toBe(150_000);
  });

  it('sums only active credit card debt', () => {
    const accounts: Account[] = [
      { ...baseAccount, id: 'card-1', type: 'credit_card', currentBalance: 40_000 },
      { ...baseAccount, id: 'card-2', type: 'credit_card', currentBalance: 25_000 },
      { ...baseAccount, id: 'cash', currentBalance: 100_000 },
    ];

    expect(calculateCreditCardDebt(accounts)).toBe(65_000);
  });
});
