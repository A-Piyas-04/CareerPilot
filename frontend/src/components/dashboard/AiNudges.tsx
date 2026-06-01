"use client";

import { RefreshCw, Sparkles } from "lucide-react";

import { AiNudgeCard } from "@/components/dashboard/AiNudgeCard";
import { Button, Card, EmptyState } from "@/components/ui";
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
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                AI Nudges
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Personalized suggestions based on your recent progress.
              </p>
            </div>
          </div>
          {generatedAt ? (
            <p className="mt-3 text-xs font-medium text-[var(--muted)]">
              {isCached ? "Cached for today" : "Generated"} at{" "}
              {new Date(generatedAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          ) : null}
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={isLoading}
          onClick={refreshNudges}
          type="button"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm text-[var(--muted-foreground)]">
            Generating personalized nudges...
          </div>
        ) : error ? (
          <div
            className={`rounded-2xl border p-4 text-sm ${
              errorCode === "quota_exceeded"
                ? "border-[var(--warning)]/30 bg-[var(--warning-soft)] text-[var(--warning)]"
                : "border-[var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger)]"
            }`}
          >
            {errorCode === "quota_exceeded" ? QUOTA_EXCEEDED_MESSAGE : error}
          </div>
        ) : nudges.length === 0 ? (
          <EmptyState
            className="p-5"
            title="No nudges right now"
            description="You are all caught up."
          />
        ) : (
          <div className="grid gap-3">
            {nudges.map((nudge) => (
              <AiNudgeCard key={nudge.id} nudge={nudge} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
