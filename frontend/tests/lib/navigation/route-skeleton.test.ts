import { describe, expect, it } from "vitest";

import {
  getSkeletonVariantForHref,
  normalizeRoutePath,
  routesMatch,
} from "@/lib/navigation-transition/route-skeleton";

describe("normalizeRoutePath", () => {
  it("strips query, hash, and trailing slash", () => {
    expect(normalizeRoutePath("/jobs/?q=1#top")).toBe("/jobs");
    expect(normalizeRoutePath("/")).toBe("/");
    expect(normalizeRoutePath("")).toBe("/");
  });
});

describe("routesMatch", () => {
  it("matches exact and nested paths", () => {
    expect(routesMatch("/jobs", "/jobs")).toBe(true);
    expect(routesMatch("/jobs/123", "/jobs")).toBe(true);
    expect(routesMatch("/tracker", "/jobs")).toBe(false);
  });
});

describe("getSkeletonVariantForHref", () => {
  it("maps routes to skeleton variants", () => {
    expect(getSkeletonVariantForHref("/jobs")).toBe("jobs");
    expect(getSkeletonVariantForHref("/tracker")).toBe("tracker");
    expect(getSkeletonVariantForHref("/dashboard")).toBe("dashboard");
    expect(getSkeletonVariantForHref("/roadmap/abc")).toBe("twoColumn");
    expect(getSkeletonVariantForHref("/unknown")).toBe("singleColumn");
  });
});
