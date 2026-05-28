import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trackerKeys } from "@/features/tracker/hooks";

import {
  addManualJob,
  listMatches,
  saveMatchToTracker,
  searchJobs,
} from "./api";
import type { JobSearchRequest, ManualJobRequest } from "./types";

export const jobsKeys = {
  matches: (resumeId: string | null) => ["job-matches", resumeId] as const,
};

export function useJobMatches(resumeId: string | null) {
  return useQuery({
    queryKey: jobsKeys.matches(resumeId),
    queryFn: () => listMatches({ resume_id: resumeId ?? undefined }),
    enabled: Boolean(resumeId),
  });
}

export function useSearchJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: JobSearchRequest) => searchJobs(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: jobsKeys.matches(variables.resume_id),
      });
    },
  });
}

export function useAddManualJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ManualJobRequest) => addManualJob(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: jobsKeys.matches(variables.resume_id),
      });
    },
  });
}

export function useSaveMatchToTracker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => saveMatchToTracker(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackerKeys.applications });
    },
  });
}
