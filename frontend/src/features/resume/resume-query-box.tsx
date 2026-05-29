"use client";

import { ChevronDown, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { ChunkEvidenceCard } from "@/components/resume/chunk-evidence-card";

import { useQueryResume } from "./hooks";
import { resumeAiButton, resumeAiTextarea, resumeCard } from "./resume-ui";
import type { ResumeStatus } from "./types";

const DEFAULT_QUERY = "What are my strongest skills?";

type ResumeQueryBoxProps = {
  resumeId?: string;
  resumeStatus?: ResumeStatus;
};

export function ResumeQueryBox({
  resumeId,
  resumeStatus,
}: ResumeQueryBoxProps) {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [expanded, setExpanded] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(min-width: 1024px)").matches,
  );
  const queryMutation = useQueryResume();

  const canQuery = Boolean(resumeId) && resumeStatus === "processed";
  const chunks = queryMutation.data ?? [];

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setExpanded(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function handleSearch() {
    if (!resumeId || !canQuery) {
      return;
    }

    queryMutation.mutate({
      query: query.trim(),
      resume_id: resumeId,
      top_k: 5,
    });
  }

  return (
    <section className={`${resumeCard} border-dashed border-zinc-300/80 p-0`}>
      <button
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-950">
              Semantic chunk search
            </h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
              Advanced
            </span>
          </div>
          <p className="mt-0.5 text-sm text-zinc-500">
            Inspect raw retrieval — the same chunks downstream agents use.
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-400 transition ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-zinc-100 px-5 pb-5">
          <label
            className="mt-4 block text-sm font-medium text-zinc-800"
            htmlFor="rag-query"
          >
            Query
          </label>
          <textarea
            className={`${resumeAiTextarea} mt-1.5`}
            disabled={!canQuery || queryMutation.isPending}
            id="rag-query"
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {!canQuery ? (
            <p className="mt-2 text-sm text-zinc-500">
              Upload and process a CV first to run semantic search.
            </p>
          ) : null}

          <button
            className={`${resumeAiButton} mt-4`}
            disabled={!canQuery || queryMutation.isPending || !query.trim()}
            type="button"
            onClick={handleSearch}
          >
            {queryMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Search chunks
              </>
            )}
          </button>

          {queryMutation.error ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {queryMutation.error.message}
            </p>
          ) : null}

          {queryMutation.isSuccess && chunks.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
              No matching chunks found. Try a different query.
            </div>
          ) : null}

          {chunks.length > 0 ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Retrieved chunks ({chunks.length})
              </p>
              {chunks.map((chunk) => (
                <ChunkEvidenceCard
                  chunk={chunk}
                  key={chunk.chunk_id}
                  variant="full"
                />
              ))}
              <p className="text-xs text-zinc-500">
                Similarity scores reflect vector distance to your query.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
