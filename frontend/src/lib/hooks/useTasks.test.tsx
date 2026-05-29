import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeSupabase } from "@/test/fakeSupabase";

import { taskKeys, useCreateStandaloneTask, useTasks } from "./useTasks";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/client");

function wrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("standalone task hooks", () => {
  let supabase: FakeSupabase;
  let queryClient: QueryClient;

  beforeEach(() => {
    supabase = new FakeSupabase();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);
  });

  it("fetches only standalone tasks scoped to the signed-in user", async () => {
    supabase.setTable("tasks", [
      {
        data: [
          {
            application_id: null,
            completed_at: null,
            created_at: "2026-05-29T10:00:00Z",
            description: null,
            due_date: null,
            goal_id: null,
            id: "task",
            priority: 2,
            roadmap_item_id: null,
            status: "todo",
            title: "Standalone",
            updated_at: "2026-05-29T10:00:00Z",
            user_id: "00000000-0000-0000-0000-000000000001",
          },
        ],
      },
    ]);

    const { result } = renderHook(() => useTasks(), { wrapper: wrapper(queryClient) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].goal_title).toBeNull();
    expect(supabase.calls[0].filters).toEqual([
      ["user_id", "00000000-0000-0000-0000-000000000001"],
      ["goal_id", null],
      ["roadmap_item_id", null],
      ["application_id", null],
    ]);
  });

  it("optimistically adds a task and rolls cache to created row", async () => {
    supabase.setTable("tasks", [
      {
        data: {
          application_id: null,
          completed_at: null,
          created_at: "2026-05-29T10:00:00Z",
          description: null,
          due_date: null,
          goal_id: null,
          id: "created",
          priority: 2,
          roadmap_item_id: null,
          status: "todo",
          title: "New task",
          updated_at: "2026-05-29T10:00:00Z",
          user_id: "00000000-0000-0000-0000-000000000001",
        },
      },
    ]);

    const { result } = renderHook(() => useCreateStandaloneTask(), {
      wrapper: wrapper(queryClient),
    });
    await result.current.mutateAsync({ title: " New task " });

    expect(queryClient.getQueryData(taskKeys.standalone)).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: "New task" })]),
    );
    expect(supabase.calls.find((call) => call.table === "tasks")?.payload).toMatchObject({
      goal_id: null,
      priority: 2,
      roadmap_item_id: null,
      title: "New task",
    });
  });
});
