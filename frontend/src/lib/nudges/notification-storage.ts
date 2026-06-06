const PANEL_DISMISS_PREFIX = "careerpilot_workspace_notification_panel_";
const TOAST_DISMISS_PREFIX = "careerpilot_workspace_notification_toast_";

const LEGACY_NUDGE_PANEL_PREFIX = "careerpilot_global_nudge_";
const LEGACY_NUDGE_TOAST_PREFIX = "careerpilot_nudge_toast_dismissed_";
const LEGACY_REMINDER_PREFIX = "careerpilot_due_reminders_";

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

function readLegacyDismissedIds(prefix: string) {
  return readDismissedIds(todayKey(prefix));
}

function migrateLegacyPanelDismissals() {
  const migrated = new Set<string>();

  for (const id of readLegacyDismissedIds(LEGACY_NUDGE_PANEL_PREFIX)) {
    migrated.add(`ai:${id}`);
  }
  for (const id of readLegacyDismissedIds(LEGACY_REMINDER_PREFIX)) {
    migrated.add(`reminder:${id}`);
  }

  return migrated;
}

function migrateLegacyToastDismissals() {
  const migrated = new Set<string>();

  for (const id of readLegacyDismissedIds(LEGACY_NUDGE_TOAST_PREFIX)) {
    migrated.add(`ai:${id}`);
  }

  return migrated;
}

export function readPanelDismissedNotifications() {
  const key = todayKey(PANEL_DISMISS_PREFIX);
  const current = readDismissedIds(key);
  if (current.size > 0) {
    return current;
  }

  const migrated = migrateLegacyPanelDismissals();
  if (migrated.size > 0) {
    writeDismissedIds(key, migrated);
  }
  return migrated;
}

export function writePanelDismissedNotifications(ids: Set<string>) {
  writeDismissedIds(todayKey(PANEL_DISMISS_PREFIX), ids);
}

export function readToastDismissedNotifications() {
  const key = todayKey(TOAST_DISMISS_PREFIX);
  const current = readDismissedIds(key);
  if (current.size > 0) {
    return current;
  }

  const migrated = migrateLegacyToastDismissals();
  if (migrated.size > 0) {
    writeDismissedIds(key, migrated);
  }
  return migrated;
}

export function writeToastDismissedNotifications(ids: Set<string>) {
  writeDismissedIds(todayKey(TOAST_DISMISS_PREFIX), ids);
}
