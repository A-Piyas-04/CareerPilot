import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

import { resolveApplicationFields } from "./types";
import type { LinkedJobSummary } from "./types";

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return format(parseISO(value), "MMM d, yyyy");
}

export function formatRelative(value: string | null | undefined) {
  if (!value) {
    return "No date";
  }

  return `${formatDistanceToNowStrict(parseISO(value))} ago`;
}

export function getApplicationTitle(application: {
  manual_job_title: string | null;
  job?: LinkedJobSummary | null;
}) {
  const resolved = resolveApplicationFields({
    manual_job_title: application.manual_job_title,
    manual_company: null,
    manual_location: null,
    job: application.job ?? null,
  });
  return resolved.title ?? "Untitled application";
}

export function getCompanyLine(application: {
  manual_company: string | null;
  manual_location: string | null;
  job?: LinkedJobSummary | null;
}) {
  const resolved = resolveApplicationFields({
    manual_job_title: null,
    manual_company: application.manual_company,
    manual_location: application.manual_location,
    job: application.job ?? null,
  });
  const parts = [resolved.company, resolved.location].filter(Boolean);

  return parts.length ? parts.join(" · ") : "Company not set";
}

export function getApplicationDeadline(application: {
  deadline?: string | null;
  job?: LinkedJobSummary | null;
  manual_job_title?: string | null;
  manual_company?: string | null;
  manual_location?: string | null;
}) {
  return resolveApplicationFields({
    manual_job_title: application.manual_job_title ?? null,
    manual_company: application.manual_company ?? null,
    manual_location: application.manual_location ?? null,
    deadline: application.deadline ?? null,
    job: application.job ?? null,
  }).deadline;
}
