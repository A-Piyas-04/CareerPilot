import { describe, expect, it } from "vitest";

import {
  findActiveNavGroup,
  findActiveNavItem,
  getAccentForPath,
  isNavItemActive,
} from "@/lib/nav-styles";

describe("nav styles helpers", () => {
  it("detects active nav items including nested paths", () => {
    expect(isNavItemActive("/jobs", "/jobs")).toBe(true);
    expect(isNavItemActive("/cover-letters/abc", "/cover-letters")).toBe(true);
    expect(isNavItemActive("/tracker", "/jobs")).toBe(false);
  });

  it("finds active group and item", () => {
    expect(findActiveNavGroup("/jobs")?.label).toBe("Discover");
    expect(findActiveNavItem("/tracker")?.item.label).toBe("Tracker");
    expect(findActiveNavGroup("/nonexistent")).toBeUndefined();
  });

  it("returns accent for pathname with emerald fallback", () => {
    expect(getAccentForPath("/jobs")).toBe("emerald");
    expect(getAccentForPath("/skill-gap")).toBe("sky");
    expect(getAccentForPath("/tracker")).toBe("violet");
    expect(getAccentForPath("/unknown")).toBe("emerald");
  });
});
