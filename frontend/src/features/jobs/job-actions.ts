import type { MatchSummary } from "./types";

export type JobActionKey =
  | "coverLetter"
  | "skillGap"
  | "roadmap"
  | "chat"
  | "tracker";

export type JobActionLink = {
  key: JobActionKey;
  href: string;
  label: string;
  shortLabel: string;
};

function buildJobDescription(job: MatchSummary["job"]): string {
  const parts = [job.description, job.requirements].filter(Boolean);
  return parts.join("\n\n").trim();
}

export function buildCoverLetterHref(jobId: string): string {
  return `/cover-letters?jobId=${encodeURIComponent(jobId)}`;
}

export function buildSkillGapHref(jobId: string): string {
  return `/skill-gap?jobId=${encodeURIComponent(jobId)}`;
}

export function buildRoadmapHref(match: MatchSummary): string {
  const params = new URLSearchParams();
  params.set("targetRole", match.job.title);
  const jd = buildJobDescription(match.job);
  if (jd) {
    params.set("jobDescription", jd.slice(0, 4000));
  }
  if (match.job.company) {
    params.set("company", match.job.company);
  }
  return `/roadmap?${params.toString()}`;
}

export function buildChatHref(jobId: string): string {
  return `/chat?jobId=${encodeURIComponent(jobId)}`;
}

export function buildTrackerHref(applicationId: string): string {
  return `/tracker?applicationId=${encodeURIComponent(applicationId)}`;
}

export function getMatchJobActions(
  match: MatchSummary,
  options?: { applicationId?: string | null },
): JobActionLink[] {
  const jobId = match.job.id;
  if (!jobId) {
    return [];
  }

  const actions: JobActionLink[] = [
    {
      key: "coverLetter",
      href: buildCoverLetterHref(jobId),
      label: "Draft cover letter",
      shortLabel: "Cover letter",
    },
    {
      key: "skillGap",
      href: buildSkillGapHref(jobId),
      label: "Analyze skill gaps",
      shortLabel: "Skill gap",
    },
    {
      key: "roadmap",
      href: buildRoadmapHref(match),
      label: "Build roadmap",
      shortLabel: "Roadmap",
    },
    {
      key: "chat",
      href: buildChatHref(jobId),
      label: "Ask assistant",
      shortLabel: "Chat",
    },
  ];

  const applicationId =
    options?.applicationId ?? match.tracker_application_id ?? null;
  if (applicationId) {
    actions.push({
      key: "tracker",
      href: buildTrackerHref(applicationId),
      label: "Open in tracker",
      shortLabel: "Tracker",
    });
  }

  return actions;
}
