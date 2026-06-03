import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/lib/api";
import { FakeSupabase } from "@/test/fakeSupabase";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/client");

describe("apiRequest", () => {
  let supabase: FakeSupabase;

  beforeEach(() => {
    supabase = new FakeSupabase();
    vi.mocked(createClient).mockReturnValue(supabase as never);
    vi.stubGlobal("fetch", vi.fn());
  });

  it("throws when session is missing", async () => {
    supabase.auth.getSession = vi.fn(async () => ({
      data: { session: null },
      error: null,
    }));

    await expect(apiRequest("/api/v1/resumes")).rejects.toThrow(
      "You need to sign in again.",
    );
  });

  it("sends authorized JSON request and returns data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await apiRequest<{ ok: boolean }>("/api/v1/resumes", {
      method: "POST",
      body: { title: "CV" },
    });

    expect(result).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/resumes"),
      expect.objectContaining({
        method: "POST",
        headers: expect.any(Headers),
      }),
    );
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-access-token");
  });

  it("throws API detail on error response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiRequest("/missing")).rejects.toThrow("Not found");
  });

  it("returns undefined for 204 responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(apiRequest("/delete")).resolves.toBeUndefined();
  });
});
