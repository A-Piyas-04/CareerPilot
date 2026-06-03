import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDashboardMetrics } from "@/lib/hooks/useDashboardMetrics";
import {
  createQueryWrapper,
  createTestQueryClient,
  mockFetchJson,
} from "../helpers/test-utils";

describe("useDashboardMetrics", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches dashboard metrics from API", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchJson({
        metrics: { activeApplications: 2, jobsApplied: 1 },
        pipeline: [],
        upcomingEvents: [],
        recentActivity: [],
      }),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.metrics.activeApplications).toBe(2);
    expect(fetch).toHaveBeenCalledWith("/api/dashboard/metrics");
  });
});
