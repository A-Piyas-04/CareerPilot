const NUDGE_DISMISS_PREFIX = "careerpilot_global_nudge_";

function nudgeStorageKey() {
  return `${NUDGE_DISMISS_PREFIX}${new Date().toISOString().slice(0, 10)}`;
}

export function readDismissedNudges() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(nudgeStorageKey()) ?? "[]",
    );
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === "string")
        : [],
    );
  } catch {
    return new Set<string>();
  }
}

export function writeDismissedNudges(ids: Set<string>) {
  window.localStorage.setItem(
    nudgeStorageKey(),
    JSON.stringify(Array.from(ids)),
  );
}
