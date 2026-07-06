import type { Budget, BudgetStatus } from "../../../src/modules/budgets/domain/budget";
import type { BudgetChanges, BudgetRepository, NewBudget } from "../../../src/modules/budgets/domain/budget-repository";

type FakeTransaction = {
  familyId: string;
  categoryId: string | null;
  amount: number;
  occurredAt: string;
  deletedAt: Date | null;
};

const containsDate = (budget: Budget, date: string) => budget.period <= date && date <= budget.periodEnd;

export class InMemoryBudgetRepository implements BudgetRepository {
  budgets: Budget[] = [];

  constructor(private readonly transactions: FakeTransaction[] = []) {}

  async findById(familyId: string, id: string) {
    return this.budgets.find((budget) => budget.familyId === familyId && budget.id === id) ?? null;
  }

  async findActiveOn(familyId: string, date: string) {
    return this.budgets.filter((budget) => budget.familyId === familyId && containsDate(budget, date));
  }

  async findLatestCycle(familyId: string) {
    const familyBudgets = this.budgets.filter((budget) => budget.familyId === familyId);
    if (familyBudgets.length === 0) {
      return [];
    }
    const latestEnd = familyBudgets.reduce((max, budget) => (budget.periodEnd > max ? budget.periodEnd : max), "");
    return familyBudgets.filter((budget) => budget.periodEnd === latestEnd);
  }

  async findPreviousCycleEnd(familyId: string, beforePeriod: string) {
    const ends = this.budgets
      .filter((budget) => budget.familyId === familyId && budget.periodEnd < beforePeriod)
      .map((budget) => budget.periodEnd);
    return ends.length === 0 ? null : ends.reduce((max, end) => (end > max ? end : max));
  }

  async redateCycle(familyId: string, fromPeriod: string, cycle: { start: string; end: string }) {
    for (const budget of this.budgets) {
      if (budget.familyId === familyId && budget.period === fromPeriod) {
        budget.period = cycle.start;
        budget.periodEnd = cycle.end;
      }
    }
  }

  async create(input: NewBudget) {
    const budget: Budget = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...input,
    };
    this.budgets.push(budget);
    return budget;
  }

  async createMany(inputs: NewBudget[]) {
    for (const input of inputs) {
      await this.create(input);
    }
  }

  async update(familyId: string, id: string, changes: BudgetChanges) {
    const budget = await this.findById(familyId, id);
    if (!budget) {
      throw new Error("Budget not found");
    }
    if (changes.amountLimit !== undefined) {
      budget.amountLimit = changes.amountLimit;
    }
    return budget;
  }

  async getStatusActiveOn(familyId: string, date: string): Promise<BudgetStatus[]> {
    const active = await this.findActiveOn(familyId, date);
    return active.map((budget) => {
      const spent = this.transactions
        .filter(
          (transaction) =>
            transaction.familyId === familyId &&
            transaction.categoryId === budget.categoryId &&
            transaction.occurredAt >= budget.period &&
            transaction.occurredAt <= budget.periodEnd &&
            transaction.deletedAt === null &&
            transaction.amount < 0,
        )
        .reduce((sum, transaction) => sum - transaction.amount, 0);

      return {
        id: budget.id,
        categoryId: budget.categoryId,
        period: budget.period,
        periodEnd: budget.periodEnd,
        amountLimit: budget.amountLimit,
        spent,
      };
    });
  }
}
