"use client";

import Link from "next/link";
import { BellRing, Sparkles, X } from "lucide-react";

import { useAiNudgeNotifications } from "@/components/nudges/AiNudgeProvider";
import type { WorkspaceNotification } from "@/components/nudges/types";
import { btnPrimary } from "@/lib/ui-theme";

function NotificationIcon({ notification }: { notification: WorkspaceNotification }) {
  if (notification.kind === "due-reminder") {
    return (
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shadow-sm">
        <BellRing className="h-4 w-4" aria-hidden />
      </span>
    );
  }

  return (
    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-700 text-white shadow-sm">
      <Sparkles className="h-4 w-4" aria-hidden />
    </span>
  );
}

export function AiNudgeToast() {
  const { dismissToast, isLoading, toastNotification } =
    useAiNudgeNotifications();
  const notification = toastNotification;

  if (isLoading || !notification) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed right-4 top-[calc(var(--cp-header-height)+0.75rem)] z-40 w-[min(100vw-2rem,22rem)]"
      role="region"
      aria-label="Workspace notification"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto overflow-hidden rounded-xl border bg-[var(--cp-card-bg)] shadow-[0_8px_30px_rgba(15,23,42,0.12)] ${
          notification.kind === "due-reminder"
            ? "border-amber-200/80 ring-1 ring-amber-100/80 dark:border-amber-900/50 dark:ring-amber-950/60"
            : "border-sky-200/80 ring-1 ring-sky-100/80 dark:border-sky-900/50 dark:ring-sky-950/60"
        }`}
      >
        <div className="flex items-start gap-3 p-4">
          <NotificationIcon notification={notification} />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--cp-text-primary)]">
                {notification.title}
              </p>
              <button
                type="button"
                className="shrink-0 rounded-md p-1 text-[var(--cp-text-muted)] transition hover:bg-[var(--cp-surface-hover)] hover:text-[var(--cp-text-primary)]"
                onClick={() => dismissToast(notification.id)}
                aria-label="Close notification popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-[var(--cp-text-muted)]">
              {notification.message}
            </p>
            <Link
              href={notification.actionHref}
              className={`${btnPrimary} mt-3 inline-flex text-xs`}
            >
              {notification.actionLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
