import type { Budget, BudgetStatus } from "./budget";

export type NewBudget = {
  familyId: string;
  categoryId: string;
  /** Storage format: 'YYYY-MM-DD'. */
  period: string;
  amountLimit: number;
};

export type BudgetChanges = {
  amountLimit?: number;
};

export interface BudgetRepository {
  findById(familyId: string, id: string): Promise<Budget | null>;
  /**
   * publicPeriod is 'YYYY-MM' and matches any stored period that STARTS in that
   * calendar month — regardless of which day-of-month was active when it was
   * created. This is what keeps budgets reachable after a family changes its
   * budgetCycleStartDay: we never recompute an old budget's stored period,
   * we just match on it.
   */
  findByFamilyCategoryAndPeriod(familyId: string, categoryId: string, publicPeriod: string): Promise<Budget | null>;
  create(input: NewBudget): Promise<Budget>;
  update(familyId: string, id: string, changes: BudgetChanges): Promise<Budget>;
  /** publicPeriod is 'YYYY-MM' — see findByFamilyCategoryAndPeriod. */
  getStatusForPeriod(familyId: string, publicPeriod: string): Promise<BudgetStatus[]>;
}
