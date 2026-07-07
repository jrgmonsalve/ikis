import type { CategoryRepository } from "../../categories/domain/category-repository";
import type { FamilyRepository } from "../../families/domain/family-repository";
import { assertValidAmountLimit, assertValidDate } from "../domain/budget";
import type { Budget } from "../domain/budget";
import type { BudgetRepository } from "../domain/budget-repository";
import { ensureCurrentCycleBudgets, todayIsoDate } from "./ensure-current-cycle-budgets";

type Dependencies = {
  budgetRepository: BudgetRepository;
  categoryRepository: CategoryRepository;
  familyRepository: FamilyRepository;
};

type CreateBudgetInput = {
  familyId: string;
  categoryId: string;
  amountLimit: number;
  today?: string;
};

export const createBudget = async (
  { budgetRepository, categoryRepository, familyRepository }: Dependencies,
  input: CreateBudgetInput,
): Promise<Budget> => {
  assertValidAmountLimit(input.amountLimit);
  const today = input.today ?? todayIsoDate();
  assertValidDate(today);

  const family = await familyRepository.findById(input.familyId);
  if (!family) {
    throw new Error("Family not found");
  }

  const category = await categoryRepository.findById(input.familyId, input.categoryId);
  if (!category) {
    throw new Error("Category not found");
  }
  if (category.parentId !== null) {
    throw new Error("Budgets can only be created for parent categories");
  }

  const { cycle, budgets } = await ensureCurrentCycleBudgets(budgetRepository, input.familyId, family, today);

  if (budgets.some((budget) => budget.categoryId === input.categoryId)) {
    throw new Error("A budget for this category already exists in the current cycle");
  }

  return budgetRepository.create({
    familyId: input.familyId,
    categoryId: input.categoryId,
    period: cycle.start,
    periodEnd: cycle.end,
    amountLimit: input.amountLimit,
  });
};
