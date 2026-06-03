import { describe, expect, it } from "vitest";

import { buildNudgePrompt } from "@/lib/reminders/prompts";

describe("buildNudgePrompt", () => {
  it("embeds activity summary as JSON", () => {
    const summary = {
      highFitUnsavedMatches: 2,
      overdueTasks: 1,
      recentSearchQuery: "ML Engineer",
      topMatchTitles: ["Backend Intern"],
    };

    const prompt = buildNudgePrompt(summary as never);

    expect(prompt).toContain("highFitUnsavedMatches");
    expect(prompt).toContain("Backend Intern");
    expect(prompt).toContain("/jobs");
    expect(prompt).toContain('"nudges"');
  });
});
