import { beforeEach, describe, expect, it, vi } from "vitest";

import { serverApiRequest } from "@/lib/api-server";

describe("serverApiRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("sends authorized JSON request", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await serverApiRequest<{ items: unknown[] }>("/api/v1/jobs", {
      accessToken: "server-token",
      method: "GET",
    });

    expect(result).toEqual({ items: [] });
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer server-token");
  });

  it("throws API detail on failure", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      serverApiRequest("/protected", { accessToken: "token" }),
    ).rejects.toThrow("Forbidden");
  });
});
