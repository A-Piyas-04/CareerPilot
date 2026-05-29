import type { ConversationMemoryMessage } from "@/lib/assistant/types";

/** Preferred chat / generation model (first in cascade when set). */
export const GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

/** Preferred intent-classification model (first in intent cascade when set). */
export const GEMINI_INTENT_MODEL =
  process.env.GEMINI_INTENT_MODEL?.trim() ||
  process.env.GEMINI_MODEL?.trim() ||
  "gemini-2.5-flash-lite";

/** Ordered fallback models for streamed chat replies (matches backend llm_service). */
export const DEFAULT_GENERATION_CASCADE = [
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
] as const;

/** Lighter models for intent classification. */
export const DEFAULT_INTENT_CASCADE = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
] as const;

const MODEL_LIST_SEPARATOR = ",";

export class GeminiApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GeminiApiError";
    this.status = status;
  }
}

type GeminiContent = {
  role: "user" | "model";
  parts: { text: string }[];
};

export type GeminiStreamResult = {
  body: ReadableStream<Uint8Array>;
  model: string;
};

export function resolveModelCascade(
  preferred: string | undefined,
  defaults: readonly string[],
): string[] {
  const first = preferred?.trim();
  const dedupedDefaults = dedupeModels(defaults);

  if (!first) {
    return dedupedDefaults;
  }

  return dedupeModels([first, ...dedupedDefaults]);
}

export function parseGeminiModelList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return dedupeModels(
    value
      .split(MODEL_LIST_SEPARATOR)
      .map((model) => model.trim())
      .filter(Boolean),
  );
}

export function generationModelCascade(preferred?: string) {
  const configuredFallbacks = parseGeminiModelList(
    process.env.GEMINI_GENERATION_FALLBACK_MODELS,
  );

  return resolveModelCascade(
    preferred ?? process.env.GEMINI_MODEL?.trim() ?? GEMINI_MODEL,
    configuredFallbacks.length > 0
      ? configuredFallbacks
      : DEFAULT_GENERATION_CASCADE,
  );
}

export function intentModelCascade(preferred?: string) {
  const configuredFallbacks = parseGeminiModelList(
    process.env.GEMINI_INTENT_FALLBACK_MODELS,
  );

  return resolveModelCascade(
    preferred ?? process.env.GEMINI_INTENT_MODEL?.trim() ?? GEMINI_INTENT_MODEL,
    configuredFallbacks.length > 0 ? configuredFallbacks : DEFAULT_INTENT_CASCADE,
  );
}

export function isRetryableGeminiError(status: number, message: string) {
  if (status === 429) {
    return true;
  }

  const normalized = message.toLowerCase();
  const isQuotaOrBilling =
    normalized.includes("quota") ||
    normalized.includes("rate") ||
    normalized.includes("rate limit") ||
    normalized.includes("limit") ||
    normalized.includes("exhausted") ||
    normalized.includes("billing");
  const isModelAvailability =
    normalized.includes("model") &&
    (normalized.includes("not found") ||
      normalized.includes("not supported") ||
      normalized.includes("unsupported") ||
      normalized.includes("unavailable"));

  return (
    (status === 403 && isQuotaOrBilling) ||
    (status === 404 && isModelAvailability) ||
    (status === 400 && isModelAvailability) ||
    (status === 503 &&
      (normalized.includes("unavailable") ||
        normalized.includes("overloaded") ||
        normalized.includes("try again")))
  );
}

export async function createGeminiStream({
  currentMessage,
  memory,
  systemPrompt,
  modelCascade,
}: {
  currentMessage: string;
  memory: ConversationMemoryMessage[];
  systemPrompt: string;
  modelCascade?: string[];
}): Promise<GeminiStreamResult> {
  const apiKey = requireGeminiApiKey();
  const models = modelCascade ?? generationModelCascade();
  const body = JSON.stringify({
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      ...memory.map(geminiContentFromMemory).filter(isGeminiContent),
      {
        role: "user",
        parts: [{ text: currentMessage }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
    },
  });

  return requestGeminiStreamWithCascade({ apiKey, body, models });
}

export async function createGeminiText({
  maxOutputTokens = 120,
  model = GEMINI_INTENT_MODEL,
  modelCascade,
  prompt,
  systemPrompt,
  temperature = 0,
}: {
  maxOutputTokens?: number;
  model?: string;
  modelCascade?: string[];
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
}) {
  const apiKey = requireGeminiApiKey();
  const models =
    modelCascade ??
    (model.includes("lite")
      ? intentModelCascade(model)
      : generationModelCascade(model));
  const body = JSON.stringify({
    ...(systemPrompt
      ? {
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
        }
      : {}),
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      maxOutputTokens,
      responseMimeType: "application/json",
      temperature,
    },
  });

  const { text } = await requestGeminiTextWithCascade({
    apiKey,
    body,
    models,
  });

  return text;
}

export function extractGeminiTextFromSsePayload(payload: string) {
  if (!payload || payload === "[DONE]") {
    return "";
  }

  const data = JSON.parse(payload) as {
    candidates?: {
      content?: {
        parts?: { text?: string }[];
      };
    }[];
  };

  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("") ?? ""
  );
}

async function requestGeminiStreamWithCascade({
  apiKey,
  body,
  models,
}: {
  apiKey: string;
  body: string;
  models: string[];
}): Promise<GeminiStreamResult> {
  let lastError: GeminiApiError | null = null;

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    const isLast = index === models.length - 1;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body,
    });

    if (response.ok && response.body) {
      return { body: response.body, model };
    }

    const message = await readGeminiError(response);
    lastError = new GeminiApiError(message, response.status);

    if (!isLast && isRetryableGeminiError(response.status, message)) {
      continue;
    }

    throw lastError;
  }

  throw lastError ?? new GeminiApiError("Gemini request failed.", 500);
}

async function requestGeminiTextWithCascade({
  apiKey,
  body,
  models,
}: {
  apiKey: string;
  body: string;
  models: string[];
}) {
  let lastError: GeminiApiError | null = null;

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    const isLast = index === models.length - 1;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body,
      },
    );

    if (response.ok) {
      const data = (await response.json()) as {
        candidates?: {
          content?: {
            parts?: { text?: string }[];
          };
        }[];
      };

      return {
        model,
        text:
          data.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? "")
            .join("") ?? "",
      };
    }

    const message = await readGeminiError(response);
    lastError = new GeminiApiError(message, response.status);

    if (!isLast && isRetryableGeminiError(response.status, message)) {
      continue;
    }

    throw lastError;
  }

  throw lastError ?? new GeminiApiError("Gemini request failed.", 500);
}

function requireGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return apiKey;
}

function geminiContentFromMemory(
  message: ConversationMemoryMessage,
): GeminiContent | null {
  const content =
    typeof message.content === "string" ? message.content.trim() : "";

  if (!content || message.role === "system") {
    return null;
  }

  return {
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: content }],
  };
}

function isGeminiContent(value: GeminiContent | null): value is GeminiContent {
  return value !== null;
}

function dedupeModels(models: readonly string[]) {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const model of models) {
    const cleanModel = model.trim();

    if (!cleanModel || seen.has(cleanModel)) {
      continue;
    }

    seen.add(cleanModel);
    deduped.push(cleanModel);
  }

  return deduped;
}

async function readGeminiError(response: Response) {
  try {
    const data = (await response.json()) as {
      error?: { message?: string };
    };
    return data.error?.message ?? "Gemini request failed.";
  } catch {
    return "Gemini request failed.";
  }
}
