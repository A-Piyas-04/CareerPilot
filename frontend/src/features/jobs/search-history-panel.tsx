"use client";

import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useState } from "react";

import { ListCardSkeleton } from "@/components/ui";
import { alertError, surfaceCard } from "@/lib/ui-theme";

import { JobSearchHistoryCard } from "./job-search-history-card";
import { useJobSearchHistory } from "./hooks";
import type { JobSearchSummary } from "./types";

type Props = {
  onViewResults: (search: JobSearchSummary) => Promise<void>;
  onRerunSearch: (search: JobSearchSummary) => void;
};

export function SearchHistoryPanel({ onViewResults, onRerunSearch }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingViewId, setLoadingViewId] = useState<string | null>(null);
  const [loadingRerunId, setLoadingRerunId] = useState<string | null>(null);
  const historyQuery = useJobSearchHistory({ enabled: isOpen });

  async function handleViewResults(search: JobSearchSummary) {
    setLoadingViewId(search.id);
    try {
      await onViewResults(search);
    } finally {
      setLoadingViewId(null);
    }
  }

  function handleRerunSearch(search: JobSearchSummary) {
    setLoadingRerunId(search.id);
    onRerunSearch(search);
    setLoadingRerunId(null);
  }

  return (
    <div className={surfaceCard}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-zinc-800"
      >
        <span>Search history</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isOpen ? (
        <div className="space-y-3 border-t border-zinc-100 p-4">
          {historyQuery.isLoading ? (
            <ListCardSkeleton count={3} cardClassName="h-24" />
          ) : historyQuery.error ? (
            <div className={alertError}>
              <p>{historyQuery.error.message}</p>
              <button
                type="button"
                onClick={() => historyQuery.refetch()}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-red-800 underline"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          ) : (historyQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-zinc-500">
              No job searches yet. Search for a role to build your history.
            </p>
          ) : (
            (historyQuery.data ?? []).map((search) => (
              <JobSearchHistoryCard
                key={search.id}
                search={search}
                isLoadingView={loadingViewId === search.id}
                isLoadingRerun={loadingRerunId === search.id}
                onViewResults={handleViewResults}
                onRerunSearch={handleRerunSearch}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
