import { describe, expect, it } from "vitest";

import { getRelatedLinks } from "@/lib/navigation-config";

describe("getRelatedLinks", () => {
  it("returns related links for known pages", () => {
    const links = getRelatedLinks("/jobs");
    expect(links.some((l) => l.href === "/resume")).toBe(true);
    expect(links.some((l) => l.href === "/tracker")).toBe(true);
  });

  it("returns related links for nested paths", () => {
    expect(getRelatedLinks("/cover-letters/abc").length).toBeGreaterThan(0);
  });

  it("returns empty array for unknown paths", () => {
    expect(getRelatedLinks("/unknown-page")).toEqual([]);
  });
});
