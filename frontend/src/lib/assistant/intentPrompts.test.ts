import { describe, expect, it } from "vitest";

import { buildIntentPrompt } from "./intentPrompts";

const input = {
  conversationMemory: [],
  profile: {
    bio: null,
    email: "john@example.com",
    full_name: "John Doe",
    location: null,
    target_role: "ML Engineer",
  },
  resumeContext: "Skills: Python, FastAPI, PostgreSQL. No PyTorch.",
  userMessage: "Write a cover letter",
};

describe("benchmark intent prompts", () => {
  it("builds required cover-letter guardrails", () => {
    const prompt = buildIntentPrompt("cover_letter", input);

    expect(prompt).toContain("250-350 words");
    expect(prompt).toContain("Do not claim experience with tools");
    expect(prompt).toContain("[Company Name]");
  });

  it("builds roadmap save disclaimer", () => {
    const prompt = buildIntentPrompt("roadmap_generation", {
      ...input,
      userMessage: "Build a roadmap",
    });

    expect(prompt).toContain("Do not say you saved the roadmap");
    expect(prompt).toContain("default to 8 weeks");
  });
});
