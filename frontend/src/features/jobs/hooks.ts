import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trackerKeys } from "@/features/tracker/hooks";

import {
  addManualJob,
  getMatchDetail,
  listJobSearches,
  listMatches,
  saveMatchToTracker,
  searchJobs,
} from "./api";
import type { JobSearchRequest, ManualJobRequest } from "./types";

export const jobsKeys = {
  matches: (resumeId: string | null, searchId?: string | null) =>
    ["job-matches", resumeId, searchId ?? "all"] as const,
  matchDetail: (matchId: string | null) => ["job-match", matchId] as const,
  searches: () => ["job-searches"] as const,
};

export function useJobMatches(
  resumeId: string | null,
  options: { searchId?: string | null; enabled?: boolean } = {},
) {
  const { searchId, enabled = true } = options;
  return useQuery({
    queryKey: jobsKeys.matches(resumeId, searchId),
    queryFn: () =>
      listMatches({
        resume_id: resumeId ?? undefined,
        search_id: searchId ?? undefined,
      }),
    enabled: Boolean(resumeId) && enabled,
  });
}

export function useMatchDetail(matchId: string | null) {
  return useQuery({
    queryKey: jobsKeys.matchDetail(matchId),
    queryFn: () => getMatchDetail(matchId!),
    enabled: Boolean(matchId),
  });
}

export function useJobSearchHistory(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: jobsKeys.searches(),
    queryFn: () => listJobSearches(),
    enabled,
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
      queryClient.invalidateQueries({
        queryKey: jobsKeys.searches(),
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
