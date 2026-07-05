import type { Budget, BudgetStatus } from "../../../src/modules/budgets/domain/budget";
import { nextCycleStart } from "../../../src/modules/budgets/domain/budget";
import type { BudgetChanges, BudgetRepository, NewBudget } from "../../../src/modules/budgets/domain/budget-repository";

type FakeTransaction = {
  familyId: string;
  categoryId: string | null;
  amount: number;
  occurredAt: string;
  deletedAt: Date | null;
};

const startsInMonth = (period: string, publicPeriod: string) => period.slice(0, 7) === publicPeriod;

export class InMemoryBudgetRepository implements BudgetRepository {
  budgets: Budget[] = [];

  constructor(private readonly transactions: FakeTransaction[] = []) {}

  async findById(familyId: string, id: string) {
    return this.budgets.find((budget) => budget.familyId === familyId && budget.id === id) ?? null;
  }

  async findByFamilyCategoryAndPeriod(familyId: string, categoryId: string, publicPeriod: string) {
    return (
      this.budgets.find(
        (budget) =>
          budget.familyId === familyId &&
          budget.categoryId === categoryId &&
          startsInMonth(budget.period, publicPeriod),
      ) ?? null
    );
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

  async getStatusForPeriod(familyId: string, publicPeriod: string): Promise<BudgetStatus[]> {
    return this.budgets
      .filter((budget) => budget.familyId === familyId && startsInMonth(budget.period, publicPeriod))
      .map((budget) => {
        const periodEnd = nextCycleStart(budget.period);
        const spent = this.transactions
          .filter(
            (transaction) =>
              transaction.familyId === familyId &&
              transaction.categoryId === budget.categoryId &&
              transaction.occurredAt >= budget.period &&
              transaction.occurredAt < periodEnd &&
              transaction.deletedAt === null &&
              transaction.amount < 0,
          )
          .reduce((sum, transaction) => sum - transaction.amount, 0);

        return { id: budget.id, categoryId: budget.categoryId, amountLimit: budget.amountLimit, spent };
      });
  }
}
