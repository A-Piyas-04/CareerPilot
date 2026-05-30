export type JobSourceName = "jsearch" | "manual";

export type Job = {
  id: string;
  search_id: string | null;
  title: string;
  company: string | null;
  location: string | null;
  salary_range: string | null;
  job_type: string | null;
  deadline: string | null;
  description: string | null;
  requirements: string | null;
  source: string | null;
  source_url: string | null;
  raw_data: Record<string, unknown> | null;
  created_at: string;
};

export type EvidenceChunk = {
  chunk_id: string | null;
  section_name: string;
  snippet: string;
  similarity: number;
};

export type MatchSummary = {
  match_id: string | null;
  job: Job;
  fit_score: number;
  matched_skills: string[];
  missing_skills: string[];
  explanation: string;
  evidence_chunks: EvidenceChunk[];
  skills_component: number;
  mean_similarity: number;
  tracker_application_id: string | null;
};

export type JobSearchRequest = {
  query: string;
  location?: string;
  source: JobSourceName;
  resume_id: string;
  limit?: number;
};

export type JobSearchResponse = {
  search_id: string;
  matches: MatchSummary[];
};

export type ManualJobRequest = {
  title: string;
  description: string;
  company?: string;
  location?: string;
  source_url?: string;
  resume_id: string;
};

export type SaveMatchResponse = {
  id: string;
  user_id: string;
  job_id: string | null;
  job_match_id: string | null;
  status: string;
  manual_job_title: string | null;
  manual_company: string | null;
  manual_location: string | null;
  deadline: string | null;
  notes: string | null;
  already_saved: boolean;
  created_at: string;
  updated_at: string;
};

export type MatchSortOption = "fit_score" | "company" | "title";

export type MatchFilterState = {
  minScore: number;
  sort: MatchSortOption;
  strongOnly: boolean;
  hasGapsOnly: boolean;
  notSavedOnly: boolean;
};

export const DEFAULT_MATCH_FILTERS: MatchFilterState = {
  minScore: 0,
  sort: "fit_score",
  strongOnly: false,
  hasGapsOnly: false,
  notSavedOnly: false,
};

export function getFitTier(score: number): {
  label: string;
  className: string;
  ringClass: string;
} {
  if (score >= 75) {
    return {
      label: "Strong match",
      className: "bg-emerald-100 text-emerald-800 border-emerald-200",
      ringClass: "text-emerald-600",
    };
  }
  if (score >= 50) {
    return {
      label: "Good match",
      className: "bg-amber-100 text-amber-800 border-amber-200",
      ringClass: "text-amber-600",
    };
  }
  return {
    label: "Weak match",
    className: "bg-zinc-100 text-zinc-700 border-zinc-200",
    ringClass: "text-zinc-500",
  };
}

export function filterAndSortMatches(
  matches: MatchSummary[],
  filters: MatchFilterState,
): MatchSummary[] {
  let result = matches.filter((match) => {
    if (match.fit_score < filters.minScore) return false;
    if (filters.strongOnly && match.fit_score < 75) return false;
    if (filters.hasGapsOnly && match.missing_skills.length === 0) return false;
    if (filters.notSavedOnly && match.tracker_application_id) return false;
    return true;
  });

  result = [...result].sort((a, b) => {
    if (filters.sort === "fit_score") {
      return b.fit_score - a.fit_score;
    }
    if (filters.sort === "company") {
      return (a.job.company ?? "").localeCompare(b.job.company ?? "");
    }
    return a.job.title.localeCompare(b.job.title);
  });

  return result;
}
