export const DEFAULT_AUTH_DESTINATION = "/dashboard";

export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_AUTH_DESTINATION;
  }
  return next;
}

export function getDestinationFromLoginHref(href: string): string {
  try {
    const url = new URL(href, "http://localhost");
    const next = url.searchParams.get("next");
    return sanitizeNextPath(next);
  } catch {
    return DEFAULT_AUTH_DESTINATION;
  }
}
