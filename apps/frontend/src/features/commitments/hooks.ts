import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CommitmentChanges, NewCommitment } from "./api";
import { createCommitment, getCommitments, getUpcomingCommitments, markCommitmentPaid, unmarkCommitmentPaid, updateCommitment } from "./api";

export const commitmentsQueryKey = ["commitments"] as const;
export const upcomingCommitmentsQueryKey = ["commitments", "upcoming"] as const;

export function useCommitments() {
  return useQuery({ queryKey: commitmentsQueryKey, queryFn: getCommitments });
}

export function useUpcomingCommitments(withinDays = 7) {
  return useQuery({
    queryKey: [...upcomingCommitmentsQueryKey, withinDays],
    queryFn: () => getUpcomingCommitments(withinDays),
  });
}

export function useCreateCommitment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCommitment) => createCommitment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commitmentsQueryKey });
      queryClient.invalidateQueries({ queryKey: upcomingCommitmentsQueryKey });
    },
  });
}

export function useUpdateCommitment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: CommitmentChanges }) => updateCommitment(id, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commitmentsQueryKey });
      queryClient.invalidateQueries({ queryKey: upcomingCommitmentsQueryKey });
    },
  });
}

export function useMarkCommitmentPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, period }: { id: string; period: string }) => markCommitmentPaid(id, period),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: upcomingCommitmentsQueryKey }),
  });
}

export function useUnmarkCommitmentPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, period }: { id: string; period: string }) => unmarkCommitmentPaid(id, period),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: upcomingCommitmentsQueryKey }),
  });
}
