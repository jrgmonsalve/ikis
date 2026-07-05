import { useQuery } from "@tanstack/react-query";
import { getToken } from "@/lib/auth-storage";
import { getCurrentUser } from "./api";

export const currentUserQueryKey = ["me"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    enabled: Boolean(getToken()),
    retry: false,
  });
}
