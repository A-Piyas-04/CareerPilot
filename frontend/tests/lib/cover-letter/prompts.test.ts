import { describe, expect, it } from "vitest";

import { buildCoverLetterPrompt } from "@/lib/cover-letter/prompts";

describe("buildCoverLetterPrompt", () => {
  it("includes job, profile, and CV context", () => {
    const prompt = buildCoverLetterPrompt({
      companyName: "Acme",
      jobDescription: "Python REST API",
      jobTitle: "Backend Intern",
      profile: { full_name: "Jane Doe", target_role: "Engineer" },
      resumeContext: "Skills: Python",
      tone: "professional",
    });

    expect(prompt).toContain("professional");
    expect(prompt).toContain("Jane Doe");
    expect(prompt).toContain("Acme");
    expect(prompt).toContain("Backend Intern");
    expect(prompt).toContain("Skills: Python");
    expect(prompt).toContain("250-350 words");
  });

  it("uses None for empty extra notes", () => {
    const prompt = buildCoverLetterPrompt({
      companyName: "Acme",
      jobDescription: "JD",
      jobTitle: "Role",
      resumeContext: "CV",
      tone: "concise",
    });

    expect(prompt).toContain("Extra user notes:\nNone");
  });
});
