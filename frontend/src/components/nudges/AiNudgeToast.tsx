"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";

import { useAiNudgeNotifications } from "@/components/nudges/AiNudgeProvider";
import { btnPrimary } from "@/lib/ui-theme";

export function AiNudgeToast() {
  const { dismissToast, isLoading, toastNudge } = useAiNudgeNotifications();
  const nudge = toastNudge;

  if (isLoading || !nudge) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed right-4 top-[calc(var(--cp-header-height)+0.75rem)] z-40 w-[min(100vw-2rem,22rem)]"
      role="region"
      aria-label="AI nudge"
      aria-live="polite"
    >
      <div className="pointer-events-auto overflow-hidden rounded-xl border border-sky-200/80 bg-[var(--cp-card-bg)] shadow-[0_8px_30px_rgba(15,23,42,0.12)] ring-1 ring-sky-100/80 dark:border-sky-900/50 dark:ring-sky-950/60">
        <div className="flex items-start gap-3 p-4">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-700 text-white shadow-sm">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--cp-text-primary)]">
                {nudge.title}
              </p>
              <button
                type="button"
                className="shrink-0 rounded-md p-1 text-[var(--cp-text-muted)] transition hover:bg-[var(--cp-surface-hover)] hover:text-[var(--cp-text-primary)]"
                onClick={() => dismissToast(nudge.id)}
                aria-label="Close nudge popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-[var(--cp-text-muted)]">
              {nudge.message}
            </p>
            <Link
              href={nudge.actionHref}
              className={`${btnPrimary} mt-3 inline-flex text-xs`}
            >
              {nudge.actionLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
