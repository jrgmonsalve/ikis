import type { Budget, BudgetStatus } from "./budget";

export type NewBudget = {
  familyId: string;
  categoryId: string;
  /** Storage format: 'YYYY-MM-01'. */
  period: string;
  amountLimit: number;
};

export type BudgetChanges = {
  amountLimit?: number;
};

export interface BudgetRepository {
  findById(familyId: string, id: string): Promise<Budget | null>;
  findByFamilyCategoryAndPeriod(familyId: string, categoryId: string, period: string): Promise<Budget | null>;
  create(input: NewBudget): Promise<Budget>;
  update(familyId: string, id: string, changes: BudgetChanges): Promise<Budget>;
  /** period in storage format: 'YYYY-MM-01'. */
  getStatusForPeriod(familyId: string, period: string): Promise<BudgetStatus[]>;
}
