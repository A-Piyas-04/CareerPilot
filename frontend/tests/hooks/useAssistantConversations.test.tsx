import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  assistantConversationKeys,
  isTemporaryAssistantConversationId,
  useAssistantConversations,
  useCreateAssistantConversation,
  useDeleteAssistantConversation,
  useUpdateAssistantConversation,
} from "@/lib/hooks/useAssistantConversations";
import { FakeSupabase } from "@/test/fakeSupabase";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/client");

function wrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useAssistantConversations", () => {
  let supabase: FakeSupabase;
  let queryClient: QueryClient;

  beforeEach(() => {
    supabase = new FakeSupabase();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);
  });

  it("identifies temporary conversation ids", () => {
    expect(isTemporaryAssistantConversationId("temp-abc")).toBe(true);
    expect(isTemporaryAssistantConversationId("real-id")).toBe(false);
  });

  it("fetches conversations for signed-in user", async () => {
    supabase.setTable("assistant_conversations", [
      {
        data: [
          {
            id: "conv-1",
            user_id: "00000000-0000-0000-0000-000000000001",
            title: "Chat",
            context: {},
            created_at: "2026-05-29T10:00:00Z",
            updated_at: "2026-05-29T10:00:00Z",
          },
        ],
      },
    ]);

    const { result } = renderHook(() => useAssistantConversations(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].title).toBe("Chat");
  });

  it("optimistically creates conversation then replaces with server row", async () => {
    supabase.setTable("assistant_conversations", [
      {
        data: {
          id: "conv-created",
          user_id: "00000000-0000-0000-0000-000000000001",
          title: "My chat",
          context: {},
          created_at: "2026-05-29T10:00:00Z",
          updated_at: "2026-05-29T10:00:00Z",
        },
      },
    ]);

    const { result } = renderHook(() => useCreateAssistantConversation(), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ title: "My chat" });
    });

    const cached = queryClient.getQueryData<Array<{ id: string; title: string }>>(
      assistantConversationKeys.all,
    );
    expect(cached?.[0].id).toBe("conv-created");
    expect(cached?.[0].title).toBe("My chat");
  });

  it("validates title before update", async () => {
    const { result } = renderHook(() => useUpdateAssistantConversation(), {
      wrapper: wrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({ conversationId: "conv-1", title: "   " }),
    ).rejects.toThrow("Title cannot be empty.");
  });

  it("deletes conversation from cache optimistically", async () => {
    queryClient.setQueryData(assistantConversationKeys.all, [
      {
        id: "conv-1",
        user_id: "00000000-0000-0000-0000-000000000001",
        title: "Old",
        context: {},
        created_at: "2026-05-29T10:00:00Z",
        updated_at: "2026-05-29T10:00:00Z",
      },
    ]);
    supabase.setTable("assistant_conversations", [{ data: null }]);

    const { result } = renderHook(() => useDeleteAssistantConversation(), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("conv-1");
    });

    expect(
      queryClient.getQueryData<Array<{ id: string }>>(assistantConversationKeys.all),
    ).toEqual([]);
  });
});
