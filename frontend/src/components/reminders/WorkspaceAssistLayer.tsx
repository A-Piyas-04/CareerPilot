"use client";

import Link from "next/link";
import { Bell, BellRing, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAiNudges } from "@/lib/hooks/useAiNudges";
import { useDueReminders } from "@/lib/hooks/useDueReminders";
import { btnPrimary, btnSecondary } from "@/lib/ui-theme";

const NUDGE_DISMISS_PREFIX = "careerpilot_global_nudge_";

export function WorkspaceAssistLayer() {
  const { dismiss, reminders } = useDueReminders();
  const { nudges } = useAiNudges();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(
    () => new Set(),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDismissedNudges(readDismissedNudges());
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);
  const reminder = reminders[0] ?? null;
  const nudge = useMemo(
    () => nudges.find((item) => !dismissedNudges.has(item.id)) ?? null,
    [dismissedNudges, nudges],
  );

  useEffect(() => {
    if (!notificationsEnabled || !reminder || typeof Notification === "undefined") {
      return;
    }
    if (Notification.permission === "granted") {
      new Notification(reminder.title, { body: reminder.message });
    }
  }, [notificationsEnabled, reminder]);

  async function enableNotifications() {
    if (typeof Notification === "undefined") {
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
  }

  function dismissNudge(id: string) {
    setDismissedNudges((current) => {
      const next = new Set(current);
      next.add(id);
      writeDismissedNudges(next);
      return next;
    });
  }

  if (!mounted || (!reminder && !nudge)) {
    return null;
  }

  return (
    <div className="sticky top-16 z-30 border-b border-[var(--cp-border)] bg-[var(--cp-card-bg)]/95 px-4 py-2 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        {reminder ? (
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <BellRing className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--cp-text-primary)]">{reminder.title}</p>
              <p className="text-sm text-[var(--cp-text-muted)]">{reminder.message}</p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {typeof Notification !== "undefined" &&
              Notification.permission === "default" ? (
                <button
                  type="button"
                  onClick={enableNotifications}
                  className={btnSecondary}
                >
                  <Bell className="h-4 w-4" />
                  Browser alerts
                </button>
              ) : null}
              <Link href={reminder.actionHref} className={btnPrimary}>
                {reminder.actionLabel}
              </Link>
              <button
                type="button"
                className="rounded-md p-2 text-[var(--cp-text-muted)] hover:bg-[var(--cp-surface-hover)]"
                onClick={() => dismiss(reminder.id)}
                aria-label="Dismiss reminder"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : nudge ? (
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--cp-text-primary)]">{nudge.title}</p>
              <p className="text-sm text-[var(--cp-text-muted)]">{nudge.message}</p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Link href={nudge.actionHref} className={btnPrimary}>
                {nudge.actionLabel}
              </Link>
              <button
                type="button"
                className="rounded-md p-2 text-[var(--cp-text-muted)] hover:bg-[var(--cp-surface-hover)]"
                onClick={() => dismissNudge(nudge.id)}
                aria-label="Dismiss nudge"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function nudgeStorageKey() {
  return `${NUDGE_DISMISS_PREFIX}${new Date().toISOString().slice(0, 10)}`;
}

function readDismissedNudges() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(nudgeStorageKey()) ?? "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function writeDismissedNudges(ids: Set<string>) {
  window.localStorage.setItem(nudgeStorageKey(), JSON.stringify(Array.from(ids)));
}
