export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type Application = {
  id: string;
  user_id: string;
  job_id: string | null;
  job_match_id: string | null;
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
