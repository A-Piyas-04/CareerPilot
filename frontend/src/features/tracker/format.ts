import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

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
}) {
  return application.manual_job_title ?? "Untitled application";
}

export function getCompanyLine(application: {
  manual_company: string | null;
  manual_location: string | null;
}) {
  const parts = [application.manual_company, application.manual_location].filter(
    Boolean,
  );

  return parts.length ? parts.join(" · ") : "Company not set";
}
