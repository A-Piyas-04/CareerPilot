import { describe, expect, it } from "vitest";

import { createGeminiText, GeminiApiError } from "@/lib/gemini";

const shouldRun = process.env.RUN_LIVE_AI_TESTS === "1" && Boolean(process.env.GEMINI_API_KEY);

describe.skipIf(!shouldRun)("live Gemini assistant smoke", () => {
  it("can classify a simple assistant message or tolerate quota limits", async () => {
    try {
      const response = await createGeminiText({
        maxOutputTokens: 20,
        prompt: "Return JSON: {\"intent\":\"general\"}",
        systemPrompt: "Return JSON only.",
        temperature: 0,
      });
      expect(response).toContain("intent");
    } catch (error) {
      if (error instanceof GeminiApiError && [429, 403].includes(error.status)) {
        console.warn(`Skipping live Gemini assertion: ${error.message}`);
        return;
      }
      throw error;
    }
  });
});
