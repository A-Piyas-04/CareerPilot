import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeSupabase } from "@/test/fakeSupabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/assistant/getResumeContext", () => ({
  getResumeContext: vi.fn(async () => ({
    text: "Skills: Python, FastAPI, PostgreSQL.",
    usedResumeChunks: [],
  })),
}));

vi.mock("@/lib/assistant/loadConversationMemory", () => ({
  loadConversationMemory: vi.fn(async () => []),
}));

vi.mock("@/lib/assistant/detectIntent", () => ({
  detectAssistantIntent: vi.fn(async () => ({
    confidence: 1,
    intent: "cover_letter",
    method: "rule",
  })),
}));

vi.mock("@/lib/gemini", () => ({
  GEMINI_MODEL: "gemini-test",
  GeminiApiError: class GeminiApiError extends Error {
    status = 500;
  },
  createGeminiStream: vi.fn(),
  extractGeminiTextFromSsePayload: vi.fn((payload: string) => {
    const data = JSON.parse(payload);
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }),
}));

const { createClient } = await import("@/lib/supabase/server");
const { createGeminiStream } = await import("@/lib/gemini");
const route = await import("./route");

describe("POST /api/assistant/chat", () => {
  let supabase: FakeSupabase;

  beforeEach(() => {
    supabase = new FakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    vi.mocked(createGeminiStream).mockReset();
  });

  it("rejects invalid conversation ids before persistence", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/assistant/chat", {
        body: JSON.stringify({ conversationId: "temp-123", message: "Hello" }),
        method: "POST",
      }) as never,
    );

    expect(response.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });

  it("streams Gemini text and persists user and assistant messages", async () => {
    const conversationId = "00000000-0000-4000-8000-000000000010";
    supabase.setTable("assistant_conversations", [
      {
        data: {
          id: conversationId,
          title: "New conversation",
          user_id: "00000000-0000-0000-0000-000000000001",
        },
      },
    ]);
    supabase.setTable("profiles", [{ data: { full_name: "John Doe" } }]);
    const encoder = new TextEncoder();
    vi.mocked(createGeminiStream).mockResolvedValue(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              'data: {"candidates":[{"content":{"parts":[{"text":"Hello "}]}}]}\n\n',
            ),
          );
          controller.enqueue(
            encoder.encode(
              'data: {"candidates":[{"content":{"parts":[{"text":"there"}]}}]}\n\n',
            ),
          );
          controller.close();
        },
      }),
    );

    const response = await route.POST(
      new Request("http://localhost/api/assistant/chat", {
        body: JSON.stringify({
          conversationId,
          message: "Write a cover letter",
        }),
        method: "POST",
      }) as never,
    );

    await expect(response.text()).resolves.toBe("Hello there");
    const messageInserts = supabase.calls.filter(
      (call) => call.table === "assistant_messages" && call.mode === "insert",
    );
    expect(messageInserts).toHaveLength(2);
    expect(messageInserts[0].payload).toMatchObject({ role: "user" });
    expect(messageInserts[1].payload).toMatchObject({
      content: "Hello there",
      role: "assistant",
    });
    expect(
      supabase.calls.some(
        (call) => call.table === "assistant_conversations" && call.mode === "update",
      ),
    ).toBe(true);
  });
});
