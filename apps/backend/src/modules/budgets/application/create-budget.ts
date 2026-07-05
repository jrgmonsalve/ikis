import type { CategoryRepository } from "../../categories/domain/category-repository";
import { assertValidAmountLimit, assertValidPeriod, toStoragePeriod } from "../domain/budget";
import type { Budget } from "../domain/budget";
import type { BudgetRepository } from "../domain/budget-repository";

type Dependencies = {
  budgetRepository: BudgetRepository;
  categoryRepository: CategoryRepository;
};

type CreateBudgetInput = {
  familyId: string;
  categoryId: string;
  /** Public format: 'YYYY-MM'. */
  period: string;
  amountLimit: number;
};

export const createBudget = async (
  { budgetRepository, categoryRepository }: Dependencies,
  input: CreateBudgetInput,
): Promise<Budget> => {
  assertValidPeriod(input.period);
  assertValidAmountLimit(input.amountLimit);

  const category = await categoryRepository.findById(input.familyId, input.categoryId);
  if (!category) {
    throw new Error("Category not found");
  }

  const period = toStoragePeriod(input.period);
  const existing = await budgetRepository.findByFamilyCategoryAndPeriod(input.familyId, input.categoryId, period);
  if (existing) {
    throw new Error("A budget for this category and period already exists");
  }

  return budgetRepository.create({
    familyId: input.familyId,
    categoryId: input.categoryId,
    period,
    amountLimit: input.amountLimit,
  });
};
