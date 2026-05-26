import type { SupabaseClient } from "@supabase/supabase-js";

import type { ConversationMemoryMessage } from "./types";

type AssistantMessageRow = {
  role: "user" | "assistant" | "system";
  content: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export async function loadConversationMemory({
  conversationId,
  limit = 12,
  supabase,
  userId,
}: {
  conversationId: string;
  limit?: number;
  supabase: SupabaseClient;
  userId: string;
}): Promise<ConversationMemoryMessage[]> {
  const { data, error } = await supabase
    .from("assistant_messages")
    .select("role, content, metadata, created_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AssistantMessageRow[])
    .filter((message) => {
      if (!message.content?.trim()) {
        return false;
      }

      return message.metadata?.placeholder !== true;
    })
    .reverse()
    .map((message) => ({
      role: message.role,
      content: message.content ?? "",
    }));
}
