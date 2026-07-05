import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountsQueryKey } from "@/features/accounts/hooks";
import { budgetsQueryKey } from "@/features/budgets/hooks";
import type { NewTransaction, TransactionChanges } from "./api";
import { createTransaction, deleteTransaction, getTransactions, updateTransaction } from "./api";

export const transactionsQueryKey = ["transactions"] as const;

export function useTransactions() {
  return useQuery({ queryKey: transactionsQueryKey, queryFn: getTransactions });
}

function useInvalidateAfterMutation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: transactionsQueryKey });
    queryClient.invalidateQueries({ queryKey: accountsQueryKey });
    queryClient.invalidateQueries({ queryKey: budgetsQueryKey });
  };
}

export function useCreateTransaction() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: (input: NewTransaction) => createTransaction(input),
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: TransactionChanges }) => updateTransaction(id, changes),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: invalidate,
  });
}
