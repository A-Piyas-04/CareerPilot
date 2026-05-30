import type { PageSkeletonVariant } from "@/components/ui/skeleton-layouts";

export function normalizeRoutePath(href: string): string {
  const [path] = href.split("#")[0].split("?");
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path || "/";
}

export function routesMatch(pathname: string, href: string): boolean {
  const target = normalizeRoutePath(href);
  const current = normalizeRoutePath(pathname);
  return current === target || current.startsWith(`${target}/`);
}

export function getSkeletonVariantForHref(href: string): PageSkeletonVariant {
  const path = normalizeRoutePath(href);

  if (path.startsWith("/jobs")) return "jobs";
  if (path.startsWith("/tracker")) return "tracker";
  if (path.startsWith("/resume")) return "resume";
  if (path.startsWith("/calendar")) return "calendar";
  if (path.startsWith("/chat")) return "chat";
  if (path.startsWith("/goals")) return "singleColumn";
  if (path.startsWith("/dashboard")) return "dashboard";
  if (path.startsWith("/skill-gap")) return "twoColumn";
  if (path.startsWith("/cover-letters")) return "twoColumn";
  if (path.startsWith("/roadmap")) return "twoColumn";

  return "singleColumn";
}
