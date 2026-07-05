import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountsQueryKey } from "@/features/accounts/hooks";
import type { NewTransfer, TransferChanges } from "./api";
import { createTransfer, deleteTransfer, getTransfers, updateTransfer } from "./api";

export const transfersQueryKey = ["transfers"] as const;

export function useTransfers() {
  return useQuery({ queryKey: transfersQueryKey, queryFn: getTransfers });
}

function useInvalidateAfterMutation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: transfersQueryKey });
    queryClient.invalidateQueries({ queryKey: accountsQueryKey });
  };
}

export function useCreateTransfer() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: (input: NewTransfer) => createTransfer(input),
    onSuccess: invalidate,
  });
}

export function useUpdateTransfer() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: TransferChanges }) => updateTransfer(id, changes),
    onSuccess: invalidate,
  });
}

export function useDeleteTransfer() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: (id: string) => deleteTransfer(id),
    onSuccess: invalidate,
  });
}
