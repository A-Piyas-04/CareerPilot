import { describe, expect, it } from "vitest";

import {
  mergeApplicationUpdate,
  resolveApplicationFields,
} from "@/features/tracker/types";
import type { Application } from "@/features/tracker/types";

const baseApplication: Application = {
  id: "app-1",
  user_id: "user-1",
  job_id: null,
  job_match_id: null,
  job: {
    id: "job-1",
    title: "Engineer",
    company: "Acme",
    location: "Remote",
    source_url: "https://jobs.example.com/1",
    salary_range: null,
    deadline: "2026-06-01",
  },
  job_match: null,
  manual_job_title: null,
  manual_company: null,
  manual_location: null,
  status: "saved",
  notes: null,
  applied_at: null,
  deadline: null,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
};

describe("tracker type helpers", () => {
  it("merges updates while preserving nested job data", () => {
    const merged = mergeApplicationUpdate(baseApplication, {
      ...baseApplication,
      status: "applied",
      job: null,
      job_match: { fit_score: 90, matched_skills: [], missing_skills: [], explanation: null },
    });

    expect(merged.status).toBe("applied");
    expect(merged.job?.company).toBe("Acme");
    expect(merged.job_match?.fit_score).toBe(90);
  });

  it("resolves display fields from manual overrides or linked job", () => {
    expect(resolveApplicationFields(baseApplication)).toMatchObject({
      title: "Engineer",
      company: "Acme",
      location: "Remote",
      deadline: "2026-06-01",
      sourceUrl: "https://jobs.example.com/1",
    });

    expect(
      resolveApplicationFields({
        manual_job_title: "Custom Role",
        manual_company: "Beta",
        manual_location: "SG",
        job: null,
      }),
    ).toMatchObject({
      title: "Custom Role",
      company: "Beta",
      location: "SG",
    });
  });
});
