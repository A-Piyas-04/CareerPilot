import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAiNudges } from "./useAiNudges";

describe("useAiNudges", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads server-cached nudges on mount", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        cached: true,
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
    expect(fetch).toHaveBeenCalledWith(
      "/api/reminders/generate",
      expect.objectContaining({
        body: JSON.stringify({ force: false }),
        method: "POST",
      }),
    );
  });

  it("loads fresh nudges when the server has no cache", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
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
    );

    const { result } = renderHook(() => useAiNudges());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isCached).toBe(false);
    expect(result.current.nudges[0].id).toBe("fresh");
  });

  it("refresh requests a forced generation and does not show stale nudges on error", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          cached: true,
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
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: "nudge_generation_failed",
            message: "Could not generate AI nudges right now.",
          },
          { status: 500 },
        ),
      );

    const { result } = renderHook(() => useAiNudges());
    await waitFor(() => expect(result.current.isCached).toBe(true));

    await act(async () => {
      await result.current.refreshNudges();
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fetch).toHaveBeenLastCalledWith(
      "/api/reminders/generate",
      expect.objectContaining({
        body: JSON.stringify({ force: true }),
        method: "POST",
      }),
    );
    expect(result.current.errorCode).toBe("nudge_generation_failed");
    expect(result.current.nudges).toEqual([]);
  });

  function jsonResponse(body: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(body), init);
  }
});
