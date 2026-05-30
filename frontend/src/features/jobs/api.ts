import { apiRequest } from "@/lib/api";

import type {
  JobSearchRequest,
  JobSearchResponse,
  ManualJobRequest,
  MatchSummary,
  SaveMatchResponse,
} from "./types";

export function searchJobs(input: JobSearchRequest) {
  return apiRequest<JobSearchResponse>("/api/v1/jobs/search", {
    method: "POST",
    body: { limit: 20, ...input },
  });
}

export function listMatches(
  params: {
    resume_id?: string;
    search_id?: string;
    job_id?: string;
    min_score?: number;
    saved_only?: boolean;
    limit?: number;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.resume_id) query.set("resume_id", params.resume_id);
  if (params.search_id) query.set("search_id", params.search_id);
  if (params.job_id) query.set("job_id", params.job_id);
  if (typeof params.min_score === "number")
    query.set("min_score", String(params.min_score));
  if (params.saved_only) query.set("saved_only", "true");
  if (typeof params.limit === "number")
    query.set("limit", String(params.limit));
  const suffix = query.toString();
  return apiRequest<MatchSummary[]>(
    `/api/v1/jobs/matches${suffix ? `?${suffix}` : ""}`,
  );
}

export function getMatchDetail(matchId: string) {
  return apiRequest<MatchSummary>(`/api/v1/jobs/matches/${matchId}`);
}

export function addManualJob(input: ManualJobRequest) {
  return apiRequest<MatchSummary>("/api/v1/jobs/manual", {
    method: "POST",
    body: input,
  });
}

export function saveMatchToTracker(matchId: string) {
  return apiRequest<SaveMatchResponse>(
    `/api/v1/jobs/matches/${matchId}/save`,
    {
      method: "POST",
    },
  );
}
