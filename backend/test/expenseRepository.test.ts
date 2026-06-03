import { describe, expect, it, vi } from 'vitest';
import { ExpenseRepository } from '../src/repositories/expenseRepository.js';

describe('ExpenseRepository', () => {
  it('writes an expense using the single-table keys', async () => {
    const send = vi.fn().mockResolvedValue({});
    const repository = new ExpenseRepository('ExpensesTable', { send } as never);

    await repository.create({
      id: 'expense-1',
      userId: 'user-1',
      amount: 42,
      category: 'Travel',
      expenseDate: '2026-06-02',
      createdAt: '2026-06-02T00:00:00.000Z',
      updatedAt: '2026-06-02T00:00:00.000Z'
    });

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0];
    expect(command.input.Item.PK).toBe('USER#user-1');
    expect(command.input.Item.SK).toBe('EXPENSE#2026-06-02#expense-1');
    expect(command.input.Item.GSI1PK).toBe('EXPENSE#expense-1');
    expect(command.input.Item.GSI1SK).toBe('USER#user-1');
  });
});
