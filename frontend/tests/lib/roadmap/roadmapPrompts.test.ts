import { describe, expect, it } from "vitest";

import { buildRoadmapPrompt } from "@/lib/roadmap/roadmapPrompts";

describe("buildRoadmapPrompt", () => {
  it("includes duration and target role constraints", () => {
    const prompt = buildRoadmapPrompt({
      targetRole: "ML Engineer",
      durationWeeks: 4,
      resumeContext: "Skills: Python",
      profile: { full_name: "Jane" },
      jobDescription: "PyTorch required",
    });

    expect(prompt).toContain("ML Engineer");
    expect(prompt).toContain("4 weeks");
    expect(prompt).toContain("exactly 4 objects");
    expect(prompt).toContain("Skills: Python");
    expect(prompt).toContain("PyTorch required");
  });

  it("handles missing job description", () => {
    const prompt = buildRoadmapPrompt({
      targetRole: "Data Analyst",
      durationWeeks: 2,
      resumeContext: "Excel",
    });

    expect(prompt).toContain("Not provided");
  });
});
