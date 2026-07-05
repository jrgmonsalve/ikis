import { apiFetch } from "@/lib/api-client";

export type Family = {
  id: string;
  name: string;
  budgetCycleStartDay: number;
  createdAt: string;
};

export function createFamily(name: string): Promise<Family> {
  return apiFetch<Family>("/families", { method: "POST", body: { name } });
}

export function getFamily(): Promise<Family> {
  return apiFetch<Family>("/families");
}

export function updateFamilySettings(budgetCycleStartDay: number): Promise<Family> {
  return apiFetch<Family>("/families", { method: "PATCH", body: { budgetCycleStartDay } });
}
