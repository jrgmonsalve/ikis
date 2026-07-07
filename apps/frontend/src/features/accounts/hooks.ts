import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountChanges, NewAccount } from "./api";
import { createAccount, deleteAccount, getAccounts, updateAccount } from "./api";

export const accountsQueryKey = ["accounts"] as const;

export function useAccounts() {
  return useQuery({ queryKey: accountsQueryKey, queryFn: getAccounts });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewAccount) => createAccount(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsQueryKey }),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: AccountChanges }) => updateAccount(id, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsQueryKey }),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsQueryKey }),
  });
}
