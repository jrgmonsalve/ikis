import type { Category } from "../../categories/domain/category";
import { ensureCurrentCycleBudgets, todayIsoDate } from "../../budgets/application/ensure-current-cycle-budgets";
import type { BudgetRepository } from "../../budgets/domain/budget-repository";
import type { FamilyRepository } from "../../families/domain/family-repository";

export class BudgetExceededError extends Error {
  constructor(
    message: string,
    public readonly categoryId: string,
    public readonly remaining: number,
  ) {
    super(message);
    this.name = "BudgetExceededError";
  }
}

type Dependencies = {
  budgetRepository: BudgetRepository;
  familyRepository: FamilyRepository;
};

type PreviousExpense = {
  categoryId: string | null;
  occurredAt: string;
  amount: number;
};

type ExpenseCheck = {
  familyId: string;
  category: Category;
  occurredAt: string;
  /** Positive amount of the expense being recorded. */
  requestedAmount: number;
  /** The transaction's state before this change, to avoid a same-category edit blocking itself. */
  excluding?: PreviousExpense | null;
  today?: string;
};

export const assertWithinBudget = async (
  { budgetRepository, familyRepository }: Dependencies,
  { familyId, category, occurredAt, requestedAmount, excluding = null, today = todayIsoDate() }: ExpenseCheck,
): Promise<void> => {
  const family = await familyRepository.findById(familyId);
  if (!family) {
    return;
  }

  const budgetCategoryId = category.parentId ?? category.id;

  await ensureCurrentCycleBudgets(budgetRepository, familyId, family, today);
  const statuses = await budgetRepository.getStatusActiveOn(familyId, occurredAt);
  const status = statuses.find((entry) => entry.categoryId === budgetCategoryId);
  if (!status) {
    return;
  }

  const excludesPreviousAmount =
    excluding !== null &&
    excluding.categoryId === category.id &&
    excluding.amount < 0 &&
    excluding.occurredAt >= status.period &&
    excluding.occurredAt <= status.periodEnd;

  const spent = excludesPreviousAmount ? status.spent + excluding.amount : status.spent;
  const remaining = status.amountLimit - spent;

  if (requestedAmount > remaining) {
    throw new BudgetExceededError(
      `Expense exceeds the remaining budget for this category (remaining: ${remaining})`,
      budgetCategoryId,
      remaining,
    );
  }
};
