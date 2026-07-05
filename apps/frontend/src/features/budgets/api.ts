import { apiFetch } from "@/lib/api-client";

export type Budget = {
  id: string;
  familyId: string;
  categoryId: string;
  period: string;
  amountLimit: number;
  createdAt: string;
};

export type BudgetStatus = {
  id: string;
  categoryId: string;
  amountLimit: number;
  spent: number;
};

export type NewBudget = {
  categoryId: string;
  /** 'YYYY-MM' */
  period: string;
  amountLimit: number;
};

export function getBudgetStatus(period: string): Promise<BudgetStatus[]> {
  return apiFetch<BudgetStatus[]>(`/budgets?period=${period}`);
}

export function createBudget(input: NewBudget): Promise<Budget> {
  return apiFetch<Budget>("/budgets", { method: "POST", body: input });
}

export function updateBudget(id: string, amountLimit: number): Promise<Budget> {
  return apiFetch<Budget>(`/budgets/${id}`, { method: "PATCH", body: { amountLimit } });
}
