import { beforeEach, describe, expect, it, vi } from "vitest";

import { classifyIntentWithGemini, detectAssistantIntent, detectRuleIntent } from "./detectIntent";

vi.mock("@/lib/gemini", () => ({
  GeminiApiError: class GeminiApiError extends Error {
    status = 429;
  },
  createGeminiText: vi.fn(),
}));

const { createGeminiText } = await import("@/lib/gemini");

describe("assistant intent detection", () => {
  beforeEach(() => {
    vi.mocked(createGeminiText).mockReset();
  });

  it.each([
    ["Am I ready for an ML Engineer role?", "readiness_check"],
    ["What skills am I missing for ML Engineer?", "skill_gap"],
    ["Build me a 3-month roadmap for ML Engineer", "roadmap_generation"],
    ["Write a cover letter for Acme", "cover_letter"],
  ])("detects strong rule intent for %s", (message, intent) => {
    expect(detectRuleIntent(message)).toMatchObject({
      confidence: 1,
      intent,
      method: "rule",
    });
  });

  it("uses Gemini classification when no rule matches", async () => {
    vi.mocked(createGeminiText).mockResolvedValue(
      JSON.stringify({
        confidence: 0.82,
        intent: "roadmap_generation",
        reason: "The user asks to map next weeks.",
      }),
    );

    await expect(classifyIntentWithGemini("Can you map out my next 12 weeks?")).resolves.toMatchObject({
      confidence: 0.82,
      intent: "roadmap_generation",
      method: "model",
    });
  });

  it("falls back to general when Gemini classification fails", async () => {
    vi.mocked(createGeminiText).mockRejectedValue(new Error("quota exceeded"));

    await expect(detectAssistantIntent("Help me apply better")).resolves.toMatchObject({
      confidence: 0,
      intent: "general",
      method: "fallback",
    });
  });
});
