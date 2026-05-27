export type JobSourceName = "jsearch" | "manual";

export type Job = {
  id: string;
  search_id: string | null;
  title: string;
  company: string | null;
  location: string | null;
  salary_range: string | null;
  job_type: string | null;
  description: string | null;
  requirements: string | null;
  source: string | null;
  source_url: string | null;
  raw_data: Record<string, unknown> | null;
  created_at: string;
};

export type MatchSummary = {
  match_id: string | null;
  job: Job;
  fit_score: number;
  matched_skills: string[];
  missing_skills: string[];
  explanation: string;
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
  created_at: string;
  updated_at: string;
};
