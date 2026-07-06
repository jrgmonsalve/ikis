import { assertValidBudgetCycleEndDay } from "../domain/family";
import type { Family } from "../domain/family";
import type { FamilyChanges, FamilyRepository } from "../domain/family-repository";

type Dependencies = {
  familyRepository: FamilyRepository;
};

type UpdateFamilySettingsInput = {
  familyId: string;
  changes: FamilyChanges;
};

export const updateFamilySettings = async (
  { familyRepository }: Dependencies,
  { familyId, changes }: UpdateFamilySettingsInput,
): Promise<Family> => {
  if (changes.budgetCycleEndDay !== undefined) {
    assertValidBudgetCycleEndDay(changes.budgetCycleEndDay);
  }

  const existing = await familyRepository.findById(familyId);
  if (!existing) {
    throw new Error("Family not found");
  }

  return familyRepository.update(familyId, changes);
};
