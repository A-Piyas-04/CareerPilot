import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useAnalyzeSkillGap,
  useSkillGapAnalyses,
  useSkillGapDetail,
} from "@/lib/hooks/useSkillGap";
import {
  createQueryWrapper,
  createTestQueryClient,
} from "../helpers/test-utils";

vi.mock("@/lib/career-api", () => ({
  analyzeSkillGap: vi.fn(),
  getSkillGapAnalysis: vi.fn(),
  listSkillGapAnalyses: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const careerApi = await import("@/lib/career-api");

describe("useSkillGap hooks", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.mocked(careerApi.listSkillGapAnalyses).mockReset();
    vi.mocked(careerApi.getSkillGapAnalysis).mockReset();
    vi.mocked(careerApi.analyzeSkillGap).mockReset();
  });

  it("lists skill gap analyses", async () => {
    vi.mocked(careerApi.listSkillGapAnalyses).mockResolvedValue([
      { id: "sg-1", target_role: "Engineer" },
    ] as never);

    const { result } = renderHook(() => useSkillGapAnalyses(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].id).toBe("sg-1");
  });

  it("fetches skill gap detail when id is set", async () => {
    vi.mocked(careerApi.getSkillGapAnalysis).mockResolvedValue({
      id: "sg-1",
      gaps: [],
    } as never);

    const { result } = renderHook(() => useSkillGapDetail("sg-1"), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(careerApi.getSkillGapAnalysis).toHaveBeenCalledWith("sg-1");
  });

  it("does not fetch detail when id is null", () => {
    renderHook(() => useSkillGapDetail(null), {
      wrapper: createQueryWrapper(queryClient),
    });

    expect(careerApi.getSkillGapAnalysis).not.toHaveBeenCalled();
  });

  it("runs analyze mutation", async () => {
    vi.mocked(careerApi.analyzeSkillGap).mockResolvedValue({
      id: "sg-new",
    } as never);

    const { result } = renderHook(() => useAnalyzeSkillGap(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await result.current.mutateAsync({
      target_role: "ML Engineer",
      job_description: "Python",
    });

    expect(careerApi.analyzeSkillGap).toHaveBeenCalledWith({
      target_role: "ML Engineer",
      job_description: "Python",
    });
  });
});
