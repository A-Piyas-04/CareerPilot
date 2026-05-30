"use client";

import { RefreshCw, Sparkles } from "lucide-react";

import { AiNudgeCard } from "@/components/dashboard/AiNudgeCard";
import { useAiNudges } from "@/lib/hooks/useAiNudges";
import { QUOTA_EXCEEDED_MESSAGE } from "@/lib/reminders/types";

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
    <section className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">AI Nudges</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Personalized suggestions based on your recent progress.
              </p>
            </div>
          </div>
          {generatedAt ? (
            <p className="mt-3 text-xs font-medium text-zinc-400">
              {isCached ? "Cached for today" : "Generated"} at{" "}
              {new Date(generatedAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          ) : null}
        </div>
        <button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm font-semibold text-zinc-700 hover:border-emerald-300 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          onClick={refreshNudges}
          type="button"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
            Generating personalized nudges...
          </div>
        ) : error ? (
          <div
            className={`rounded-md border p-4 text-sm ${
              errorCode === "quota_exceeded"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {errorCode === "quota_exceeded" ? QUOTA_EXCEEDED_MESSAGE : error}
          </div>
        ) : nudges.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
            No nudges right now. You are all caught up.
          </div>
        ) : (
          <div className="grid gap-3">
            {nudges.map((nudge) => (
              <AiNudgeCard key={nudge.id} nudge={nudge} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
