export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type LinkedJobSummary = {
  id: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  source_url: string | null;
  salary_range: string | null;
  deadline: string | null;
};

export type LinkedJobMatchSummary = {
  fit_score: number | null;
  matched_skills: string[];
  missing_skills: string[];
  explanation: string | null;
};

export type Application = {
  id: string;
  user_id: string;
  job_id: string | null;
  job_match_id: string | null;
  job: LinkedJobSummary | null;
  job_match: LinkedJobMatchSummary | null;
  manual_job_title: string | null;
  manual_company: string | null;
  manual_location: string | null;
  status: ApplicationStatus;
  notes: string | null;
  applied_at: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
};

export type ApplicationHistory = {
  id: string;
  application_id: string;
  old_status: ApplicationStatus | null;
  new_status: ApplicationStatus;
  note: string | null;
  changed_at: string;
};

export type ApplicationDetail = Application & {
  history: ApplicationHistory[];
};

export type CreateApplicationInput = {
  manual_job_title: string;
  manual_company?: string;
  manual_location?: string;
  deadline?: string;
  notes?: string;
};

export type UpdateApplicationInput = Partial<CreateApplicationInput>;

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

export function resolveApplicationFields(application: {
  manual_job_title: string | null;
  manual_company: string | null;
  manual_location: string | null;
  deadline?: string | null;
  job?: LinkedJobSummary | null;
}) {
  const job = application.job;
  return {
    title: application.manual_job_title ?? job?.title ?? null,
    company: application.manual_company ?? job?.company ?? null,
    location: application.manual_location ?? job?.location ?? null,
    deadline: application.deadline ?? job?.deadline ?? null,
    sourceUrl: job?.source_url ?? null,
  };
}
