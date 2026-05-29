import { act, renderHook, waitFor } from "@testing-library/react";
import { format } from "date-fns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAiNudges } from "./useAiNudges";

describe("useAiNudges", () => {
  const cacheKey = `careerpilot_nudges_${format(new Date(), "yyyy-MM-dd")}`;

  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("uses same-day cached nudges without calling the API", async () => {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        cached: false,
        generatedAt: "2026-05-29T10:00:00Z",
        nudges: [
          {
            actionHref: "/goals",
            actionLabel: "Open Goals",
            id: "cached",
            message: "Cached message",
            title: "Cached",
            type: "task",
          },
        ],
      }),
    );

    const { result } = renderHook(() => useAiNudges());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isCached).toBe(true);
    expect(result.current.nudges[0].id).toBe("cached");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches and caches nudges when no cache exists", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          cached: false,
          generatedAt: "2026-05-29T12:00:00Z",
          nudges: [
            {
              actionHref: "/tracker",
              actionLabel: "Open Tracker",
              id: "fresh",
              message: "Fresh message",
              title: "Fresh",
              type: "application",
            },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useAiNudges());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.nudges[0].id).toBe("fresh");
    expect(localStorage.getItem(cacheKey)).toContain("fresh");
  });

  it("refresh bypasses cache and does not show stale nudges on error", async () => {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        cached: false,
        generatedAt: "2026-05-29T10:00:00Z",
        nudges: [
          {
            actionHref: "/goals",
            actionLabel: "Open Goals",
            id: "cached",
            message: "Cached message",
            title: "Cached",
            type: "task",
          },
        ],
      }),
    );
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: "quota_exceeded",
          message: "AI nudges are unavailable because the AI quota limit was exceeded.",
        }),
        { status: 429 },
      ),
    );

    const { result } = renderHook(() => useAiNudges());
    await waitFor(() => expect(result.current.isCached).toBe(true));

    await act(async () => {
      await result.current.refreshNudges();
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.errorCode).toBe("quota_exceeded");
    expect(result.current.nudges).toEqual([]);
  });
});
