import { describe, expect, it } from 'vitest';
import { validateExpenseInput } from '../src/shared/validation.js';

describe('validateExpenseInput', () => {
  it('accepts a valid expense input', () => {
    expect(() =>
      validateExpenseInput({
        amount: 12.5,
        category: 'Food',
        expenseDate: '2026-06-02'
      })
    ).not.toThrow();
  });

  it('rejects non-positive amounts', () => {
    expect(() =>
      validateExpenseInput({
        amount: 0,
        category: 'Food',
        expenseDate: '2026-06-02'
      })
    ).toThrow('greater than zero');
  });
});
