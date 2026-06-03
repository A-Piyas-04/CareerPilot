import { describe, expect, it } from "vitest";

import {
  buildCoverLetterPrompt,
  buildReadinessPrompt,
  buildRoadmapPrompt,
} from "@/components/chat/workflow-prompt-builders";

describe("workflow prompt builders", () => {
  it("builds roadmap wizard prompt", () => {
    const prompt = buildRoadmapPrompt({
      targetRole: "ML Engineer",
      durationWeeks: 6,
      constraints: "10 hrs/week",
      jobDescription: "PyTorch",
    });

    expect(prompt).toContain("6-week roadmap");
    expect(prompt).toContain("ML Engineer");
    expect(prompt).toContain("10 hrs/week");
    expect(prompt).toContain("PyTorch");
  });

  it("builds cover letter wizard prompt", () => {
    const prompt = buildCoverLetterPrompt({
      jobTitle: "Intern",
      company: "Acme",
      jobDescription: "Python",
      tone: "enthusiastic",
    });

    expect(prompt).toContain("enthusiastic");
    expect(prompt).toContain("Intern");
    expect(prompt).toContain("Acme");
  });

  it("builds readiness wizard prompt", () => {
    const prompt = buildReadinessPrompt({
      targetRole: "Data Analyst",
      jobDescription: "SQL and Excel",
    });

    expect(prompt).toContain("Am I ready");
    expect(prompt).toContain("Data Analyst");
    expect(prompt).toContain("SQL and Excel");
  });
});
