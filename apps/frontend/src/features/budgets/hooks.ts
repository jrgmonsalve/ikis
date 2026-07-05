import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewBudget } from "./api";
import { createBudget, getBudgetStatus, updateBudget } from "./api";

export const budgetsQueryKey = ["budgets"] as const;

export function useBudgetStatus(period: string) {
  return useQuery({
    queryKey: [...budgetsQueryKey, period],
    queryFn: () => getBudgetStatus(period),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewBudget) => createBudget(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetsQueryKey }),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amountLimit }: { id: string; amountLimit: number }) => updateBudget(id, amountLimit),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetsQueryKey }),
  });
}
