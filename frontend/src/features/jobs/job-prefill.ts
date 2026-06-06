import type { MatchSummary } from "@/features/jobs/types";

export type SavedJobPrefill = {
  targetRole: string;
  jobDescription: string;
  jobId: string;
  label: string;
  previewMissingSkills: string[];
};

export function matchToSavedJobPrefill(match: MatchSummary): SavedJobPrefill {
  const job = match.job;
  const description = [job.description, job.requirements]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  return {
    targetRole: job.title,
    jobDescription: description,
    jobId: job.id,
    label: [job.title, job.company].filter(Boolean).join(" at "),
    previewMissingSkills: match.missing_skills,
  };
}

export function formatSavedJobOption(match: MatchSummary) {
  const company = match.job.company ? ` at ${match.job.company}` : "";
  return `${match.job.title}${company} (${Math.round(match.fit_score)}% fit)`;
}
