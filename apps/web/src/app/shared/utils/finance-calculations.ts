import { Account } from '../models/domain.models';

export function calculateAvailableBalance(accounts: Account[]): number {
  return accounts
    .filter((account) => account.status === 'active' && account.type !== 'credit_card')
    .reduce((total, account) => total + account.currentBalance, 0);
}

export function calculateCreditCardDebt(accounts: Account[]): number {
  return accounts
    .filter((account) => account.status === 'active' && account.type === 'credit_card')
    .reduce((total, account) => total + account.currentBalance, 0);
}
