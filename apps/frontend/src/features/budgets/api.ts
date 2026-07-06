import { apiFetch } from "@/lib/api-client";

export type Budget = {
  id: string;
  familyId: string;
  categoryId: string;
  period: string;
  periodEnd: string;
  amountLimit: number;
  createdAt: string;
};

export type BudgetStatus = {
  id: string;
  categoryId: string;
  period: string;
  periodEnd: string;
  amountLimit: number;
  spent: number;
};

export type NewBudget = {
  categoryId: string;
  amountLimit: number;
};

export function getBudgetStatus(date: string): Promise<BudgetStatus[]> {
  return apiFetch<BudgetStatus[]>(`/budgets?date=${date}`);
}

export function createBudget(input: NewBudget): Promise<Budget> {
  return apiFetch<Budget>("/budgets", { method: "POST", body: input });
}

export function updateBudget(id: string, amountLimit: number): Promise<Budget> {
  return apiFetch<Budget>(`/budgets/${id}`, { method: "PATCH", body: { amountLimit } });
}

export type CycleRange = {
  start: string;
  end: string;
};

export function defineBudgetCycle(cycle: CycleRange): Promise<CycleRange> {
  return apiFetch<CycleRange>("/budgets/cycle", { method: "PUT", body: cycle });
}
