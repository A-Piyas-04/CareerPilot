import { describe, expect, it } from "vitest";

import { createGeminiText, GeminiApiError, GEMINI_MODEL } from "@/lib/gemini";
import { parseRoadmapJson } from "@/lib/roadmap/parseRoadmapJson";
import { buildRoadmapPrompt, ROADMAP_SYSTEM_PROMPT } from "@/lib/roadmap/roadmapPrompts";

const shouldRun = process.env.RUN_LIVE_AI_TESTS === "1" && Boolean(process.env.GEMINI_API_KEY);

describe.skipIf(!shouldRun)("live Gemini roadmap smoke", () => {
  it("can return parseable roadmap JSON or tolerate quota limits", async () => {
    try {
      const response = await createGeminiText({
        maxOutputTokens: 1200,
        model: GEMINI_MODEL,
        prompt: buildRoadmapPrompt({
          durationWeeks: 4,
          resumeContext: "Skills: Python, FastAPI, PostgreSQL. Backend intern.",
          targetRole: "ML Engineer",
        }),
        systemPrompt: ROADMAP_SYSTEM_PROMPT,
        temperature: 0.1,
      });
      expect(parseRoadmapJson(response, 4).items).toHaveLength(4);
    } catch (error) {
      if (error instanceof GeminiApiError && [429, 403].includes(error.status)) {
        console.warn(`Skipping live Gemini assertion: ${error.message}`);
        return;
      }
      throw error;
    }
  });
});
