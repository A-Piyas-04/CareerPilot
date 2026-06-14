import { describe, expect, it } from "vitest";

import {
  buildChatHref,
  buildCoverLetterHref,
  buildEvidenceMapHref,
  buildRoadmapHref,
  buildSkillGapHref,
  buildTrackerHref,
  getMatchJobActions,
} from "@/features/jobs/job-actions";
import type { MatchSummary } from "@/features/jobs/types";

const baseMatch: MatchSummary = {
  match_id: "match-1",
  fit_score: 80,
  job: {
    id: "job-1",
    search_id: null,
    title: "Backend Intern",
    company: "Acme",
    description: "Build APIs",
    requirements: "Python",
    location: "Remote",
    job_type: null,
    source: null,
    source_url: null,
    salary_range: null,
    deadline: null,
    raw_data: null,
    created_at: "",
  },
  matched_skills: ["Python"],
  missing_skills: ["Go"],
  explanation: "",
  evidence_chunks: [],
  skills_component: 0,
  mean_similarity: 0,
  tracker_application_id: null,
};

describe("job action link builders", () => {
  it("builds feature deep links", () => {
    expect(buildCoverLetterHref("job-1")).toBe("/cover-letters?jobId=job-1");
    expect(buildSkillGapHref("job-1")).toBe("/skill-gap?jobId=job-1");
    expect(buildChatHref("job-1")).toBe("/chat?jobId=job-1");
    expect(buildTrackerHref("app-1")).toBe("/tracker?applicationId=app-1");
    expect(buildEvidenceMapHref("match-1")).toBe(
      "/jobs/matches/match-1/evidence",
    );
  });

  it("builds roadmap href with job id", () => {
    expect(buildRoadmapHref("job-1")).toBe("/roadmap?jobId=job-1");
  });

  it("returns standard job actions including evidence map", () => {
    const actions = getMatchJobActions(baseMatch);
    expect(actions.map((a) => a.key)).toEqual([
      "evidenceMap",
      "coverLetter",
      "skillGap",
      "roadmap",
      "chat",
    ]);
  });

  it("omits evidence map when match id is missing", () => {
    const actions = getMatchJobActions({ ...baseMatch, match_id: null });
    expect(actions.map((a) => a.key)).toEqual([
      "coverLetter",
      "skillGap",
      "roadmap",
      "chat",
    ]);
  });

  it("returns empty list when job id is missing", () => {
    expect(
      getMatchJobActions({
        ...baseMatch,
        job: { ...baseMatch.job, id: "" },
      }),
    ).toEqual([]);
  });
});
