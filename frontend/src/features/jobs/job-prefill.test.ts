import { describe, expect, it } from "vitest";

import type { MatchSummary } from "@/features/jobs/types";

import {
  formatSavedJobOption,
  matchToCoverLetterPrefill,
  matchToSavedJobPrefill,
} from "./job-prefill";

function makeMatch(overrides: Partial<MatchSummary> = {}): MatchSummary {
  return {
    match_id: "match-1",
    job: {
      id: "job-1",
      search_id: "search-1",
      title: "Backend Engineer",
      company: "Acme",
      location: "Berlin",
      salary_range: null,
      job_type: null,
      deadline: null,
      description: "Build APIs",
      requirements: "Python, FastAPI",
      source: "jsearch",
      source_url: null,
      raw_data: null,
      created_at: "2026-01-01T00:00:00Z",
    },
    fit_score: 82.4,
    matched_skills: ["Python"],
    missing_skills: ["Kubernetes"],
    explanation: "Strong backend overlap",
    evidence_chunks: [],
    skills_component: 0.8,
    mean_similarity: 0.7,
    tracker_application_id: "app-1",
    ...overrides,
  };
}

describe("matchToSavedJobPrefill", () => {
  it("maps job fields and missing skills into form prefill", () => {
    const prefill = matchToSavedJobPrefill(makeMatch());

    expect(prefill.targetRole).toBe("Backend Engineer");
    expect(prefill.jobDescription).toBe("Build APIs\n\nPython, FastAPI");
    expect(prefill.jobId).toBe("job-1");
    expect(prefill.label).toBe("Backend Engineer at Acme");
    expect(prefill.previewMissingSkills).toEqual(["Kubernetes"]);
  });
});

describe("matchToCoverLetterPrefill", () => {
  it("maps saved job fields into cover letter form prefill", () => {
    const prefill = matchToCoverLetterPrefill(makeMatch());

    expect(prefill.jobTitle).toBe("Backend Engineer");
    expect(prefill.companyName).toBe("Acme");
    expect(prefill.jobDescription).toBe("Build APIs\n\nPython, FastAPI");
    expect(prefill.jobId).toBe("job-1");
    expect(prefill.label).toBe("Backend Engineer at Acme");
  });
});

describe("formatSavedJobOption", () => {
  it("includes title, company, and rounded fit score", () => {
    expect(formatSavedJobOption(makeMatch())).toBe(
      "Backend Engineer at Acme (82% fit)",
    );
  });
});
