import { describe, expect, it } from "vitest";

import { createGeminiText, GeminiApiError, GEMINI_MODEL } from "@/lib/gemini";
import { parseCoverLetterJson } from "@/lib/cover-letter/parser";
import { buildCoverLetterPrompt, COVER_LETTER_SYSTEM_PROMPT } from "@/lib/cover-letter/prompts";

const shouldRun = process.env.RUN_LIVE_AI_TESTS === "1" && Boolean(process.env.GEMINI_API_KEY);

describe.skipIf(!shouldRun)("live Gemini cover-letter smoke", () => {
  it("can return parseable cover-letter JSON or tolerate quota limits", async () => {
    try {
      const response = await createGeminiText({
        maxOutputTokens: 1200,
        model: GEMINI_MODEL,
        prompt: buildCoverLetterPrompt({
          companyName: "Acme",
          jobDescription: "Requires Python, SQL, PyTorch, and REST API experience.",
          jobTitle: "ML Engineer Intern",
          resumeContext: "Skills: Python, FastAPI, PostgreSQL. Backend intern.",
          tone: "professional",
        }),
        systemPrompt: COVER_LETTER_SYSTEM_PROMPT,
        temperature: 0.1,
      });
      expect(parseCoverLetterJson(response).content).toContain("Dear");
    } catch (error) {
      if (error instanceof GeminiApiError && [429, 403].includes(error.status)) {
        console.warn(`Skipping live Gemini assertion: ${error.message}`);
        return;
      }
      throw error;
    }
  });
});
