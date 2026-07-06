import type { CategoryRepository } from "../../categories/domain/category-repository";
import type { FamilyRepository } from "../../families/domain/family-repository";
import { assertValidAmountLimit, assertValidPeriod, toStoragePeriod } from "../domain/budget";
import type { Budget } from "../domain/budget";
import type { BudgetRepository } from "../domain/budget-repository";

type Dependencies = {
  budgetRepository: BudgetRepository;
  categoryRepository: CategoryRepository;
  familyRepository: FamilyRepository;
};

type CreateBudgetInput = {
  familyId: string;
  categoryId: string;
  /** Public format: 'YYYY-MM'. */
  period: string;
  amountLimit: number;
};

export const createBudget = async (
  { budgetRepository, categoryRepository, familyRepository }: Dependencies,
  input: CreateBudgetInput,
): Promise<Budget> => {
  assertValidPeriod(input.period);
  assertValidAmountLimit(input.amountLimit);

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

  const existing = await budgetRepository.findByFamilyCategoryAndPeriod(
    input.familyId,
    input.categoryId,
    input.period,
  );
  if (existing) {
    throw new Error("A budget for this category and period already exists");
  }

  return budgetRepository.create({
    familyId: input.familyId,
    categoryId: input.categoryId,
    period: toStoragePeriod(input.period, family.budgetCycleStartDay),
    amountLimit: input.amountLimit,
  });
};
