import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useAddRoadmapItemToCalendar,
  useCreateRoadmapTask,
  useGenerateRoadmap,
  useRoadmapDetail,
  useRoadmaps,
  useUpdateRoadmapItemStatus,
} from "@/lib/hooks/useRoadmaps";
import {
  createQueryWrapper,
  createTestQueryClient,
  mockFetchJson,
} from "../helpers/test-utils";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("useRoadmaps hooks", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches roadmap list", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchJson({ roadmaps: [{ id: "rm-1", target_role: "Engineer" }] }),
    );

    const { result } = renderHook(() => useRoadmaps(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.roadmaps[0].id).toBe("rm-1");
  });

  it("fetches roadmap detail", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchJson({
        roadmap: { id: "rm-1" },
        items: [{ id: "item-1", title: "Week 1" }],
      }),
    );

    const { result } = renderHook(() => useRoadmapDetail("rm-1"), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items[0].title).toBe("Week 1");
  });

  it("generates roadmap via POST", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchJson({ roadmap: { id: "new" }, items: [] }),
    );

    const { result } = renderHook(() => useGenerateRoadmap(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await result.current.mutateAsync({
      targetRole: "Engineer",
      durationWeeks: 4,
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/roadmap/generate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("updates roadmap item status via PATCH", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchJson({ progress: 50, item: { id: "item-1", status: "done" } }),
    );

    const { result } = renderHook(() => useUpdateRoadmapItemStatus("rm-1"), {
      wrapper: createQueryWrapper(queryClient),
    });

    await result.current.mutateAsync({ itemId: "item-1", status: "done" });
    expect(fetch).toHaveBeenCalledWith(
      "/api/roadmap/items/item-1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("creates task from roadmap item", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchJson({ created: true, task: { id: "task-1" } }),
    );

    const { result } = renderHook(() => useCreateRoadmapTask("rm-1"), {
      wrapper: createQueryWrapper(queryClient),
    });

    await result.current.mutateAsync("item-1");
    expect(fetch).toHaveBeenCalledWith(
      "/api/roadmap/items/item-1/create-task",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("adds roadmap item to calendar", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchJson({ event: { id: "evt-1", title: "Study" } }),
    );

    const { result } = renderHook(() => useAddRoadmapItemToCalendar("rm-1"), {
      wrapper: createQueryWrapper(queryClient),
    });

    await result.current.mutateAsync({
      itemId: "item-1",
      startTime: "2026-06-01T10:00:00Z",
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/roadmap/items/item-1/add-to-calendar",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
