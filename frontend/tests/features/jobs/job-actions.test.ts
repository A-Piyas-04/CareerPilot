import { describe, expect, it } from "vitest";

import {
  buildChatHref,
  buildCoverLetterHref,
  buildRoadmapHref,
  buildSkillGapHref,
  buildTrackerHref,
  getMatchJobActions,
} from "@/features/jobs/job-actions";
import type { MatchSummary } from "@/features/jobs/types";

const baseMatch: MatchSummary = {
  fit_score: 80,
  id: "match-1",
  job: {
    id: "job-1",
    title: "Backend Intern",
    company: "Acme",
    description: "Build APIs",
    requirements: "Python",
    location: "Remote",
    source_url: null,
    salary_range: null,
    deadline: null,
  },
  matched_skills: ["Python"],
  missing_skills: ["Go"],
  explanation: null,
  tracker_application_id: null,
};

describe("job action link builders", () => {
  it("builds feature deep links", () => {
    expect(buildCoverLetterHref("job-1")).toBe("/cover-letters?jobId=job-1");
    expect(buildSkillGapHref("job-1")).toBe("/skill-gap?jobId=job-1");
    expect(buildChatHref("job-1")).toBe("/chat?jobId=job-1");
    expect(buildTrackerHref("app-1")).toBe("/tracker?applicationId=app-1");
  });

  it("builds roadmap href with job id", () => {
    expect(buildRoadmapHref("job-1")).toBe("/roadmap?jobId=job-1");
  });

  it("returns standard job actions", () => {
    const actions = getMatchJobActions(baseMatch);
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
        job: { ...baseMatch.job, id: null },
      }),
    ).toEqual([]);
  });
});
