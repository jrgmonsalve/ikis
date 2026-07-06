import type { Budget, BudgetStatus } from "./budget";

export type NewBudget = {
  familyId: string;
  categoryId: string;
  /** First day of the cycle, inclusive ('YYYY-MM-DD'). */
  period: string;
  /** Last day of the cycle, inclusive ('YYYY-MM-DD'). */
  periodEnd: string;
  amountLimit: number;
};

export type BudgetChanges = {
  amountLimit?: number;
};

export interface BudgetRepository {
  findById(familyId: string, id: string): Promise<Budget | null>;
  /** Budgets whose stored cycle contains the date (period <= date <= periodEnd). */
  findActiveOn(familyId: string, date: string): Promise<Budget[]>;
  /** Budgets of the most recent stored cycle (the one with the greatest periodEnd). */
  findLatestCycle(familyId: string): Promise<Budget[]>;
  /** Greatest periodEnd strictly before the given period start, or null. */
  findPreviousCycleEnd(familyId: string, beforePeriod: string): Promise<string | null>;
  /** Moves every budget of the cycle starting at fromPeriod to the new range. */
  redateCycle(familyId: string, fromPeriod: string, cycle: { start: string; end: string }): Promise<void>;
  create(input: NewBudget): Promise<Budget>;
  createMany(inputs: NewBudget[]): Promise<void>;
  update(familyId: string, id: string, changes: BudgetChanges): Promise<Budget>;
  /** Status (spent vs limit) of the budgets whose stored cycle contains the date. */
  getStatusActiveOn(familyId: string, date: string): Promise<BudgetStatus[]>;
}
