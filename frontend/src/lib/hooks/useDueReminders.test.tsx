import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeSupabase } from "@/test/fakeSupabase";

import { useDueReminders } from "./useDueReminders";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/client");

describe("useDueReminders", () => {
  let supabase: FakeSupabase;

  beforeEach(() => {
    window.localStorage.clear();
    supabase = new FakeSupabase();
    vi.mocked(createClient).mockReturnValue(supabase as never);
  });

  it("loads due reminders and respects dismissal", async () => {
    supabase.setTable("calendar_events", [
      {
        data: [
          {
            event_type: "reminder",
            id: "event",
            reminder_time: "2026-06-03T10:00:00Z",
            start_time: "2026-06-03T11:00:00Z",
            title: "Interview prep",
          },
        ],
      },
    ]);
    supabase.setTable("tasks", [{ data: [] }]);
    supabase.setTable("applications", [{ data: [] }]);
    supabase.setTable("roadmap_items", [{ data: [] }]);

    const { result } = renderHook(() => useDueReminders());

    await waitFor(() => expect(result.current.reminders).toHaveLength(1));
    expect(result.current.reminders[0].title).toBe("Calendar reminder");

    act(() => result.current.dismiss(result.current.reminders[0].id));
    expect(result.current.reminders).toHaveLength(0);
  });
});
