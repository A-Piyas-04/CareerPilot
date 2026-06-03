import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCoverLetterDetail,
  useCoverLetters,
  useDeleteCoverLetter,
  useGenerateCoverLetter,
  useUpdateCoverLetter,
} from "@/lib/hooks/useCoverLetters";
import {
  createQueryWrapper,
  createTestQueryClient,
  mockFetchError,
  mockFetchJson,
} from "../helpers/test-utils";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("useCoverLetters hooks", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches cover letter list", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchJson({ coverLetters: [{ id: "cl-1", title: "Letter" }] }),
    );

    const { result } = renderHook(() => useCoverLetters(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.coverLetters[0].id).toBe("cl-1");
    expect(fetch).toHaveBeenCalledWith(
      "/api/cover-letter",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it("fetches cover letter detail when id is provided", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchJson({ coverLetter: { id: "cl-1", content: "Hello" } }),
    );

    const { result } = renderHook(() => useCoverLetterDetail("cl-1"), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.coverLetter.content).toBe("Hello");
  });

  it("generates cover letter and invalidates list cache", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchJson({ coverLetter: { id: "new" } }),
    );
    queryClient.setQueryData(["cover-letters"], { coverLetters: [] });

    const { result } = renderHook(() => useGenerateCoverLetter(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await result.current.mutateAsync({
      jobTitle: "Intern",
      companyName: "Acme",
      jobDescription: "Python",
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/cover-letter/generate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("updates cover letter via PATCH", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchJson({ coverLetter: { id: "cl-1", content: "Updated" } }),
    );

    const { result } = renderHook(() => useUpdateCoverLetter("cl-1"), {
      wrapper: createQueryWrapper(queryClient),
    });

    await result.current.mutateAsync({ content: "Updated" });
    expect(fetch).toHaveBeenCalledWith(
      "/api/cover-letter/cl-1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("deletes cover letter via DELETE", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchJson({ ok: true }));

    const { result } = renderHook(() => useDeleteCoverLetter("cl-1"), {
      wrapper: createQueryWrapper(queryClient),
    });

    await result.current.mutateAsync();
    expect(fetch).toHaveBeenCalledWith(
      "/api/cover-letter/cl-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("throws on API error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchError("Unauthorized", 401));

    const { result } = renderHook(() => useCoverLetters(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Unauthorized");
  });
});
