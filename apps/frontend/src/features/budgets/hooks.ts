import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familyQueryKey } from "@/features/family/hooks";
import type { CycleRange, NewBudget } from "./api";
import { createBudget, defineBudgetCycle, getBudgetStatus, updateBudget } from "./api";

export const budgetsQueryKey = ["budgets"] as const;

export function useBudgetStatus(date: string) {
  return useQuery({
    queryKey: [...budgetsQueryKey, date],
    queryFn: () => getBudgetStatus(date),
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

export function useDefineBudgetCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cycle: CycleRange) => defineBudgetCycle(cycle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetsQueryKey });
      queryClient.invalidateQueries({ queryKey: familyQueryKey });
    },
  });
}
