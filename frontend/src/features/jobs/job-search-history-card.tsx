"use client";

import { format, parseISO } from "date-fns";
import { History, MapPin, RotateCcw, Search } from "lucide-react";

import { SpinnerButton } from "@/components/ui";
import { chipSky, surfaceCardMuted } from "@/lib/ui-theme";

import type { JobSearchSummary } from "./types";

type Props = {
  search: JobSearchSummary;
  isLoadingView?: boolean;
  isLoadingRerun?: boolean;
  onViewResults: (search: JobSearchSummary) => void;
  onRerunSearch: (search: JobSearchSummary) => void;
};

export function JobSearchHistoryCard({
  search,
  isLoadingView,
  isLoadingRerun,
  onViewResults,
  onRerunSearch,
}: Props) {
  const formattedDate = search.created_at
    ? format(parseISO(search.created_at), "MMM d, yyyy · h:mm a")
    : "Unknown date";

  return (
    <article className={`${surfaceCardMuted} p-4`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <History className="h-4 w-4 shrink-0 text-zinc-400" />
            <h3 className="truncate text-sm font-semibold text-zinc-950">
              {search.query}
            </h3>
            {search.source ? (
              <span className={chipSky}>{formatSourceLabel(search.source)}</span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
            {search.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {search.location}
              </span>
            ) : (
              <span>No location filter</span>
            )}
            <span>{formattedDate}</span>
            <span>
              {search.match_count}{" "}
              {search.match_count === 1 ? "result" : "results"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <SpinnerButton
            type="button"
            variant="secondary"
            loading={isLoadingView}
            loadingLabel="Loading…"
            icon={<Search className="h-4 w-4" />}
            onClick={() => onViewResults(search)}
            className="h-9 text-xs"
          >
            View results
          </SpinnerButton>
          <SpinnerButton
            type="button"
            variant="ghost"
            loading={isLoadingRerun}
            loadingLabel="Prefilling…"
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={() => onRerunSearch(search)}
            className="h-9 text-xs"
          >
            Re-run search
          </SpinnerButton>
        </div>
      </div>
    </article>
  );
}

function formatSourceLabel(source: string) {
  if (source === "jsearch") return "JSearch";
  if (source === "manual") return "Manual";
  return source;
}
