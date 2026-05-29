import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createGeminiStream,
  createGeminiText,
  generationModelCascade,
  GeminiApiError,
  intentModelCascade,
  isRetryableGeminiError,
  parseGeminiModelList,
  resolveModelCascade,
} from "./gemini";

describe("gemini model cascade", () => {
  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn() as unknown as typeof fetch,
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("puts preferred model first in cascade", () => {
    expect(
      resolveModelCascade("gemini-2.0-flash", [
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
      ]),
    ).toEqual(["gemini-2.0-flash", "gemini-2.5-pro", "gemini-1.5-flash"]);
  });

  it("parses and deduplicates comma-separated fallback model lists", () => {
    expect(
      parseGeminiModelList(
        " gemini-2.0-flash,gemini-1.5-flash,,gemini-2.0-flash ",
      ),
    ).toEqual(["gemini-2.0-flash", "gemini-1.5-flash"]);
  });

  it("uses configured generation fallback models after the preferred model", () => {
    vi.stubEnv(
      "GEMINI_GENERATION_FALLBACK_MODELS",
      "gemini-custom-a, gemini-custom-b, gemini-custom-a",
    );

    expect(generationModelCascade("gemini-primary")).toEqual([
      "gemini-primary",
      "gemini-custom-a",
      "gemini-custom-b",
    ]);
  });

  it("uses configured intent fallback models after the preferred model", () => {
    vi.stubEnv(
      "GEMINI_INTENT_FALLBACK_MODELS",
      "gemini-intent-a, gemini-intent-b",
    );

    expect(intentModelCascade("gemini-intent-primary")).toEqual([
      "gemini-intent-primary",
      "gemini-intent-a",
      "gemini-intent-b",
    ]);
  });

  it("detects quota errors as retryable", () => {
    expect(isRetryableGeminiError(429, "Too Many Requests")).toBe(true);
    expect(
      isRetryableGeminiError(403, "Quota exceeded for generate_content"),
    ).toBe(true);
    expect(
      isRetryableGeminiError(403, "Billing has not been enabled"),
    ).toBe(true);
    expect(
      isRetryableGeminiError(404, "Model gemini-old was not found"),
    ).toBe(true);
    expect(
      isRetryableGeminiError(400, "Model is not supported for this endpoint"),
    ).toBe(true);
    expect(isRetryableGeminiError(500, "Internal error")).toBe(false);
  });

  it("falls back to the next model on quota exhaustion for text generation", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { message: "Quota exceeded" } }),
          { status: 429 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: '{"intent":"general"}' }] } }],
          }),
          { status: 200 },
        ),
      );

    const models = intentModelCascade("gemini-2.0-flash-lite");
    const text = await createGeminiText({
      modelCascade: models,
      model: models[0],
      prompt: "hello",
      systemPrompt: "classify",
    });

    expect(text).toContain("general");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("gemini-2.0-flash-lite");
    expect(fetchMock.mock.calls[1]?.[0]).toContain("gemini-2.5-flash-lite");
  });

  it("falls back to the next model on quota exhaustion for streaming", async () => {
    const fetchMock = vi.mocked(fetch);
    const encoder = new TextEncoder();
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { message: "Quota exceeded" } }),
          { status: 429 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(
                encoder.encode(
                  'data: {"candidates":[{"content":{"parts":[{"text":"Hi"}]}}]}\n\n',
                ),
              );
              controller.close();
            },
          }),
          { status: 200 },
        ),
      );

    const models = generationModelCascade("gemini-2.0-flash");
    const result = await createGeminiStream({
      modelCascade: models,
      currentMessage: "hi",
      memory: [],
      systemPrompt: "You are helpful.",
    });

    expect(result.model).toBe("gemini-2.5-pro");
    expect(fetchMock.mock.calls[1]?.[0]).toContain("gemini-2.5-pro");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws the last error when every model in the cascade fails", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Quota exceeded" } }), {
        status: 429,
      }),
    );

    await expect(
      createGeminiText({
        modelCascade: ["gemini-a", "gemini-b"],
        model: "gemini-a",
        prompt: "hello",
      }),
    ).rejects.toBeInstanceOf(GeminiApiError);

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
