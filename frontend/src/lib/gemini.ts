import type { ConversationMemoryMessage } from "@/lib/assistant/types";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

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

export async function createGeminiStream({
  currentMessage,
  memory,
  systemPrompt,
}: {
  currentMessage: string;
  memory: ConversationMemoryMessage[];
  systemPrompt: string;
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
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
    }),
  });

  if (!response.ok || !response.body) {
    throw new GeminiApiError(await readGeminiError(response), response.status);
  }

  return response.body;
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
