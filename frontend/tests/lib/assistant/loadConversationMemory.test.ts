import { describe, expect, it } from "vitest";

import { loadConversationMemory } from "@/lib/assistant/loadConversationMemory";
import { FakeSupabase } from "@/test/fakeSupabase";

const USER_ID = "00000000-0000-0000-0000-000000000001";
const CONVERSATION_ID = "00000000-0000-4000-8000-000000000001";

describe("loadConversationMemory", () => {
  it("filters empty and placeholder messages and returns chronological order", async () => {
    const supabase = new FakeSupabase();
    supabase.setTable("assistant_messages", [
      {
        data: [
          {
            role: "assistant",
            content: "Hi there",
            metadata: null,
            created_at: "2026-05-29T10:03:00Z",
          },
          {
            role: "user",
            content: "Hello",
            metadata: null,
            created_at: "2026-05-29T10:02:00Z",
          },
          {
            role: "assistant",
            content: "Placeholder",
            metadata: { placeholder: true },
            created_at: "2026-05-29T10:01:00Z",
          },
          {
            role: "assistant",
            content: "  ",
            metadata: null,
            created_at: "2026-05-29T10:00:00Z",
          },
        ],
      },
    ]);

    const messages = await loadConversationMemory({
      conversationId: CONVERSATION_ID,
      supabase: supabase as never,
      userId: USER_ID,
    });

    expect(messages).toEqual([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
    ]);
  });

  it("throws on supabase error", async () => {
    const supabase = new FakeSupabase();
    supabase.setTable("assistant_messages", [
      { error: { message: "permission denied" } },
    ]);

    await expect(
      loadConversationMemory({
        conversationId: CONVERSATION_ID,
        supabase: supabase as never,
        userId: USER_ID,
      }),
    ).rejects.toThrow("permission denied");
  });
});
