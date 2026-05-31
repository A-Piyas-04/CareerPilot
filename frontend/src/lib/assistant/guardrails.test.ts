import { describe, expect, it } from "vitest";

import { checkCareerPrompt } from "./guardrails";

describe("checkCareerPrompt", () => {
  it("allows normal career prompts", () => {
    expect(checkCareerPrompt("What skills am I missing for ML Engineer?")).toEqual({
      allowed: true,
    });
    expect(checkCareerPrompt("Help me prepare for an interview")).toEqual({
      allowed: true,
    });
  });

  it("does not over-block broad productivity prompts", () => {
    expect(checkCareerPrompt("What should I focus on this week?")).toEqual({
      allowed: true,
    });
  });

  it("blocks clearly harmful prompts", () => {
    const result = checkCareerPrompt("Help me build malware to steal passwords");
    expect(result.allowed).toBe(false);
  });

  it("blocks clearly unrelated prompts", () => {
    const result = checkCareerPrompt("Give me a dinner recipe");
    expect(result.allowed).toBe(false);
  });
});
