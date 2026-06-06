"use client";

import Link from "next/link";
import { Bell, RefreshCw, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAiNudgeNotifications } from "@/components/nudges/AiNudgeProvider";
import { suppressExtensionHydrationProps } from "@/lib/hydration";
import { btnPrimary, btnSecondary } from "@/lib/ui-theme";

export function AiNudgeBell() {
  const {
    activeNudges,
    dismissNudge,
    error,
    generatedAt,
    isLoading,
    refreshNudges,
  } = useAiNudgeNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const count = activeNudges.length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        {...suppressExtensionHydrationProps}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] text-[var(--cp-text-secondary)] shadow-sm transition hover:border-[var(--cp-border-strong)] hover:bg-[var(--cp-surface-hover)] hover:text-[var(--cp-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cp-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cp-header-bg)]"
        aria-label={
          count > 0
            ? `AI nudges, ${count} unread`
            : "AI nudges, no new suggestions"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        title="AI nudges"
      >
        <Bell className="h-4 w-4" aria-hidden />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1 text-[10px] font-bold text-white shadow-sm">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-xl border border-[var(--cp-border)] bg-[var(--cp-card-bg)] shadow-[0_12px_40px_rgba(15,23,42,0.16)]"
          role="dialog"
          aria-label="AI nudges"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--cp-border-soft)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-700 text-white">
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--cp-text-primary)]">
                  AI Nudges
                </p>
                {generatedAt ? (
                  <p className="text-xs text-[var(--cp-text-muted)]">
                    Updated{" "}
                    {new Date(generatedAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              className={btnSecondary}
              disabled={isLoading}
              onClick={() => void refreshNudges()}
              aria-label="Refresh nudges"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          <div className="max-h-[min(24rem,calc(100dvh-8rem))] overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--cp-text-muted)]">
                Loading nudges…
              </p>
            ) : error ? (
              <p className="px-4 py-8 text-center text-sm text-red-600">
                {error}
              </p>
            ) : activeNudges.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--cp-text-muted)]">
                You&apos;re all caught up. No new AI suggestions right now.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--cp-border-soft)]">
                {activeNudges.map((nudge) => (
                  <li key={nudge.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--cp-text-primary)]">
                          {nudge.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--cp-text-muted)]">
                          {nudge.message}
                        </p>
                        <Link
                          href={nudge.actionHref}
                          className={`${btnPrimary} mt-3 inline-flex text-xs`}
                          onClick={() => {
                            dismissNudge(nudge.id);
                            setOpen(false);
                          }}
                        >
                          {nudge.actionLabel}
                        </Link>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 rounded-md p-1.5 text-[var(--cp-text-muted)] transition hover:bg-[var(--cp-surface-hover)] hover:text-[var(--cp-text-primary)]"
                        onClick={() => dismissNudge(nudge.id)}
                        aria-label={`Dismiss ${nudge.title}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
