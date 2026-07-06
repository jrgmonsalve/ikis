import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFamily, updateFamilySettings } from "./api";

export const familyQueryKey = ["family"] as const;

export function useFamily() {
  return useQuery({ queryKey: familyQueryKey, queryFn: getFamily });
}

export function useUpdateFamilySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (budgetCycleEndDay: number) => updateFamilySettings(budgetCycleEndDay),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: familyQueryKey }),
  });
}
