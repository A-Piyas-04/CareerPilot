import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeSupabase } from "@/test/fakeSupabase";

import { useCalendarEvents, useCreateCalendarEvent } from "./useCalendarEvents";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/client");

function wrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("calendar hooks", () => {
  let supabase: FakeSupabase;
  let queryClient: QueryClient;

  beforeEach(() => {
    supabase = new FakeSupabase();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);
  });

  it("combines calendar events with application deadline pseudo-events", async () => {
    supabase.setTable("calendar_events", [
      {
        data: [
          {
            application_id: null,
            completed_at: null,
            created_at: "2026-05-29T10:00:00Z",
            description: null,
            end_time: null,
            event_type: "study",
            id: "event",
            reminder_time: null,
            start_time: "2026-05-30T10:00:00Z",
            task_id: null,
            title: "Study",
            updated_at: "2026-05-29T10:00:00Z",
            user_id: "00000000-0000-0000-0000-000000000001",
          },
        ],
      },
    ]);
    supabase.setTable("applications", [
      {
        data: [
          {
            deadline: "2026-06-01",
            id: "application",
            jobs: { company: "Acme", title: "ML Engineer" },
            manual_company: null,
            manual_job_title: null,
          },
        ],
      },
    ]);

    const { result } = renderHook(() => useCalendarEvents(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((event) => event.resource.kind)).toEqual([
      "calendar_event",
      "application_deadline",
    ]);
    expect(result.current.data?.[1].title).toContain("Deadline");
  });

  it("creates a user-scoped study event", async () => {
    supabase.setTable("calendar_events", [
      {
        data: {
          application_id: null,
          created_at: "2026-05-29T10:00:00Z",
          description: "Learn",
          end_time: null,
          event_type: "study",
          id: "event",
          reminder_time: null,
          start_time: "2026-05-30T10:00:00.000Z",
          task_id: null,
          title: "Study",
          updated_at: "2026-05-29T10:00:00Z",
          user_id: "00000000-0000-0000-0000-000000000001",
        },
      },
    ]);

    const { result } = renderHook(() => useCreateCalendarEvent(), {
      wrapper: wrapper(queryClient),
    });
    await result.current.mutateAsync({
      description: "Learn",
      event_type: "study",
      start_time: "2026-05-30T10:00:00Z",
      title: "Study",
    });

    expect(supabase.calls.find((call) => call.table === "calendar_events")?.payload).toMatchObject({
      event_type: "study",
      title: "Study",
      user_id: "00000000-0000-0000-0000-000000000001",
    });
  });
});
