"use client";

import Link from "next/link";
import { BellRing, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useDueReminders } from "@/lib/hooks/useDueReminders";
import { btnPrimary, btnSecondary } from "@/lib/ui-theme";

export function WorkspaceAssistLayer() {
  const { dismiss, reminders } = useDueReminders();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const reminder = reminders[0] ?? null;

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

  if (!mounted || !reminder) {
    return null;
  }

  return (
    <div className="sticky top-16 z-30 border-b border-[var(--cp-border)] bg-[var(--cp-card-bg)]/95 px-4 py-2 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <BellRing className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--cp-text-primary)]">
              {reminder.title}
            </p>
            <p className="text-sm text-[var(--cp-text-muted)]">
              {reminder.message}
            </p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {typeof Notification !== "undefined" &&
            Notification.permission === "default" ? (
              <button
                type="button"
                onClick={enableNotifications}
                className={btnSecondary}
              >
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
      </div>
    </div>
  );
}
