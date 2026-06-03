import { describe, expect, it } from "vitest";

import { buildSystemPrompt } from "@/lib/assistant/buildSystemPrompt";

describe("buildSystemPrompt", () => {
  it("includes profile and resume context", () => {
    const prompt = buildSystemPrompt({
      profile: {
        full_name: "Jane Doe",
        target_role: "ML Engineer",
        location: "Singapore",
      },
      resumeContext: "Skills: Python, PyTorch",
    });

    expect(prompt).toContain("Jane Doe");
    expect(prompt).toContain("ML Engineer");
    expect(prompt).toContain("Skills: Python, PyTorch");
    expect(prompt).toContain("CareerPilot");
  });

  it("adds job context block when provided", () => {
    const prompt = buildSystemPrompt({
      profile: null,
      resumeContext: "CV text",
      jobContext: "Backend Intern at Acme",
    });

    expect(prompt).toContain("Active Job Posting Context");
    expect(prompt).toContain("Backend Intern at Acme");
  });

  it("uses fallbacks for missing profile fields", () => {
    const prompt = buildSystemPrompt({
      profile: null,
      resumeContext: "No resume",
    });

    expect(prompt).toContain("Unknown");
    expect(prompt).toContain("Not specified");
  });
});
