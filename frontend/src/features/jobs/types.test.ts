import { describe, expect, it } from "vitest";

import {
  DEFAULT_MATCH_FILTERS,
  filterAndSortMatches,
  getFitTier,
  type MatchSummary,
} from "./types";

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
      description: null,
      requirements: null,
      source: "jsearch",
      source_url: null,
      raw_data: null,
      created_at: "2026-01-01T00:00:00Z",
    },
    fit_score: 80,
    matched_skills: ["Python"],
    missing_skills: ["Go"],
    explanation: "Strong overlap",
    evidence_chunks: [],
    skills_component: 0.8,
    mean_similarity: 0.5,
    tracker_application_id: null,
    ...overrides,
  };
}

describe("filterAndSortMatches", () => {
  it("filters by minimum score", () => {
    const matches = [
      makeMatch({ match_id: "a", fit_score: 90 }),
      makeMatch({ match_id: "b", fit_score: 40 }),
    ];
    const result = filterAndSortMatches(matches, {
      ...DEFAULT_MATCH_FILTERS,
      minScore: 75,
    });
    expect(result).toHaveLength(1);
    expect(result[0].match_id).toBe("a");
  });

  it("sorts by company name", () => {
    const matches = [
      makeMatch({ match_id: "a", job: { ...makeMatch().job, company: "Zeta" } }),
      makeMatch({ match_id: "b", job: { ...makeMatch().job, company: "Alpha" } }),
    ];
    const result = filterAndSortMatches(matches, {
      ...DEFAULT_MATCH_FILTERS,
      sort: "company",
    });
    expect(result.map((match) => match.job.company)).toEqual(["Alpha", "Zeta"]);
  });

  it("supports not-saved-only filter", () => {
    const matches = [
      makeMatch({ match_id: "a", tracker_application_id: "app-1" }),
      makeMatch({ match_id: "b", tracker_application_id: null }),
    ];
    const result = filterAndSortMatches(matches, {
      ...DEFAULT_MATCH_FILTERS,
      notSavedOnly: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].match_id).toBe("b");
  });
});

describe("getFitTier", () => {
  it("labels strong matches", () => {
    expect(getFitTier(82).label).toBe("Strong match");
  });

  it("labels weak matches", () => {
    expect(getFitTier(30).label).toBe("Weak match");
  });
});
