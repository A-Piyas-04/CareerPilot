import type { MatchSummary } from "./types";

export type JobActionKey =
  | "evidenceMap"
  | "coverLetter"
  | "skillGap"
  | "roadmap"
  | "chat";

export type JobActionLink = {
  key: JobActionKey;
  href: string;
  label: string;
  shortLabel: string;
};

export function buildEvidenceMapHref(matchId: string): string {
  return `/jobs/matches/${encodeURIComponent(matchId)}/evidence`;
}

export function buildCoverLetterHref(jobId: string): string {
  return `/cover-letters?jobId=${encodeURIComponent(jobId)}`;
}

export function buildSkillGapHref(jobId: string): string {
  return `/skill-gap?jobId=${encodeURIComponent(jobId)}`;
}

export function buildRoadmapHref(jobId: string): string {
  return `/roadmap?jobId=${encodeURIComponent(jobId)}`;
}

export function buildChatHref(jobId: string): string {
  return `/chat?jobId=${encodeURIComponent(jobId)}`;
}

export function buildTrackerHref(applicationId: string): string {
  return `/tracker?applicationId=${encodeURIComponent(applicationId)}`;
}

export function getMatchJobActions(match: MatchSummary): JobActionLink[] {
  const jobId = match.job.id;
  if (!jobId) {
    return [];
  }

  const actions: JobActionLink[] = [];

  if (match.match_id) {
    actions.push({
      key: "evidenceMap",
      href: buildEvidenceMapHref(match.match_id),
      label: "Evidence map",
      shortLabel: "Evidence",
    });
  }

  actions.push(
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
      href: buildRoadmapHref(jobId),
      label: "Build roadmap",
      shortLabel: "Roadmap",
    },
    {
      key: "chat",
      href: buildChatHref(jobId),
      label: "Ask assistant",
      shortLabel: "Chat",
    },
  );

  return actions;
}
