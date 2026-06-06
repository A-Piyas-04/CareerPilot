const PANEL_DISMISS_PREFIX = "careerpilot_global_nudge_";
const TOAST_DISMISS_PREFIX = "careerpilot_nudge_toast_dismissed_";

function todayKey(prefix: string) {
  return `${prefix}${new Date().toISOString().slice(0, 10)}`;
}

function readDismissedIds(key: string) {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === "string")
        : [],
    );
  } catch {
    return new Set<string>();
  }
}

function writeDismissedIds(key: string, ids: Set<string>) {
  window.localStorage.setItem(key, JSON.stringify(Array.from(ids)));
}

export function readPanelDismissedNudges() {
  return readDismissedIds(todayKey(PANEL_DISMISS_PREFIX));
}

export function writePanelDismissedNudges(ids: Set<string>) {
  writeDismissedIds(todayKey(PANEL_DISMISS_PREFIX), ids);
}

export function readToastDismissedNudges() {
  return readDismissedIds(todayKey(TOAST_DISMISS_PREFIX));
}

export function writeToastDismissedNudges(ids: Set<string>) {
  writeDismissedIds(todayKey(TOAST_DISMISS_PREFIX), ids);
}
