"use client";

import { Loader2, Search } from "lucide-react";
import { useState } from "react";

import { useQueryResume } from "./hooks";
import type { ResumeQueryChunk, ResumeStatus } from "./types";
import { truncateText } from "./types";

const DEFAULT_QUERY = "What are my strongest skills?";

type ResumeQueryBoxProps = {
  resumeId?: string;
  resumeStatus?: ResumeStatus;
};

function formatSimilarity(score: number): string {
  return `${Math.round(score * 100)}%`;
}

function ChunkEvidenceCard({ chunk }: { chunk: ResumeQueryChunk }) {
  return (
    <article className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-900">
          {chunk.section_name ?? "General"}
        </p>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
          {formatSimilarity(chunk.similarity)} match
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700">
        {truncateText(chunk.chunk_text, 280)}
      </p>
    </article>
  );
}

export function ResumeQueryBox({
  resumeId,
  resumeStatus,
}: ResumeQueryBoxProps) {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const queryMutation = useQueryResume();

  const canQuery = Boolean(resumeId) && resumeStatus === "processed";
  const chunks = queryMutation.data ?? [];

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
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
      <h2 className="text-lg font-semibold text-zinc-950">RAG search test</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Run a semantic search over your resume chunks — the same context
        downstream agents will use.
      </p>

      <label className="mt-4 block text-sm font-medium text-zinc-800" htmlFor="rag-query">
        Query
      </label>
      <textarea
        className="mt-1.5 w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600/30 placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 disabled:bg-zinc-50 disabled:text-zinc-500"
        disabled={!canQuery || queryMutation.isPending}
        id="rag-query"
        rows={3}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {!canQuery ? (
        <p className="mt-2 text-sm text-zinc-500">
          Upload and process a CV first to test RAG search.
        </p>
      ) : null}

      <button
        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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
            Test RAG Search
          </>
        )}
      </button>

      {queryMutation.error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
            <ChunkEvidenceCard chunk={chunk} key={chunk.chunk_id} />
          ))}
          <p className="text-xs text-zinc-500">
            These chunks are the evidence downstream agents retrieve for
            answers.
          </p>
        </div>
      ) : null}
    </section>
  );
}
