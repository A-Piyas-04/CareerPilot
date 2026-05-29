"use client";

import { useState } from "react";

export type ChunkEvidence = {
  chunk_id: string;
  section_name?: string | null;
  chunk_text: string;
  similarity: number;
};

type ChunkEvidenceCardProps = {
  chunk: ChunkEvidence;
  variant?: "compact" | "full";
};

function formatSimilarity(score: number): string {
  return `${Math.round(score * 100)}%`;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

function SimilarityBar({ score }: { score: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, score)) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-indigo-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-zinc-500">{pct}%</span>
    </div>
  );
}

export function ChunkEvidenceCard({
  chunk,
  variant = "compact",
}: ChunkEvidenceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const previewLength = variant === "full" ? 200 : 280;
  const preview = chunk.chunk_text.slice(0, previewLength);
  const hasMore = chunk.chunk_text.length > previewLength;

  if (variant === "compact") {
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

  return (
    <article className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs font-semibold capitalize text-zinc-700">
          {chunk.section_name ?? "General"}
        </span>
        <SimilarityBar score={chunk.similarity} />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-600">
        {expanded ? chunk.chunk_text : preview}
        {hasMore && !expanded && "…"}
      </p>
      {hasMore && (
        <button
          className="mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          type="button"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </article>
  );
}
