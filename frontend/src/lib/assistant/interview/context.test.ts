import { describe, expect, it } from "vitest";

import {
  getModeFromContext,
  normalizeInterviewSettings,
} from "./context";
import { findCodingProblem, selectCodingProblem } from "./problemBank";

describe("interview context helpers", () => {
  it("defaults old conversations to general chat", () => {
    expect(getModeFromContext({})).toBe("general_chat");
    expect(getModeFromContext({ mode: "interview_prep" })).toBe(
      "interview_prep",
    );
  });

  it("normalizes interview settings safely", () => {
    const settings = normalizeInterviewSettings(
      {
        difficulty: "hard",
        focusAreas: ["graphs", "", " dynamic programming "],
        interviewType: "coding",
        targetRole: "ML Engineer",
      },
      "Backend Developer",
    );

    expect(settings).toMatchObject({
      difficulty: "hard",
      focusAreas: ["graphs", "dynamic programming"],
      interviewType: "coding",
      targetRole: "ML Engineer",
    });
  });
});

describe("interview problem bank", () => {
  it("finds curated problems and selects by difficulty", () => {
    expect(findCodingProblem("pair-sum-indexes")?.title).toBe(
      "Pair Sum Indexes",
    );

    const selected = selectCodingProblem({
      conversationId: "11111111-1111-4111-8111-111111111111",
      difficulty: "medium",
      focusAreas: ["graph"],
      messageCount: 3,
    });

    expect(selected.difficulty).toBe("medium");
    expect(selected.tags).toContain("graph");
  });
});
