"use client";

import { RefreshCw, Sparkles } from "lucide-react";

import { AiNudgeCard } from "@/components/dashboard/AiNudgeCard";
import { EmptyState } from "@/components/ui";
import { useAiNudges } from "@/lib/hooks/useAiNudges";
import { QUOTA_EXCEEDED_MESSAGE } from "@/lib/reminders/types";
import {
  alertError,
  alertWarning,
  btnSecondary,
  surfaceCard,
  surfaceCardHeader,
} from "@/lib/ui-theme";

export function AiNudges() {
  const {
    error,
    errorCode,
    generatedAt,
    isCached,
    isLoading,
    nudges,
    refreshNudges,
  } = useAiNudges();

  return (
    <section className={`overflow-hidden ${surfaceCard}`}>
      <div className={surfaceCardHeader("sky")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-800 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">AI Nudges</h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                Personalized suggestions based on your recent progress.
              </p>
              {generatedAt ? (
                <p className="mt-1 text-xs font-medium text-sky-700/70">
                  {isCached ? "Cached for today" : "Generated"} at{" "}
                  {new Date(generatedAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              ) : null}
            </div>
          </div>
          <button
            className={btnSecondary}
            disabled={isLoading}
            onClick={refreshNudges}
            type="button"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/50 p-6 text-center text-sm text-sky-800">
            Generating personalized nudges…
          </div>
        ) : error ? (
          <div
            className={
              errorCode === "quota_exceeded" ? alertWarning : alertError
            }
          >
            {errorCode === "quota_exceeded" ? QUOTA_EXCEEDED_MESSAGE : error}
          </div>
        ) : nudges.length === 0 ? (
          <EmptyState
            accent="sky"
            icon={Sparkles}
            title="You're all caught up"
            description="No nudges right now. Check back after more activity in your pipeline."
            variant="filled"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {nudges.map((nudge) => (
              <AiNudgeCard key={nudge.id} nudge={nudge} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
