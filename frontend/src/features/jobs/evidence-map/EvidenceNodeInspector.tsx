"use client";

import { ChunkEvidenceCard } from "@/components/resume/chunk-evidence-card";
import type { EvidenceMapRow } from "@/features/jobs/types";

type Props = {
  row: EvidenceMapRow | null;
  onClose: () => void;
};

const STATUS_LABEL = {
  strong: "Grounded",
  weak: "Partial",
  missing: "Gap",
} as const;

export function EvidenceNodeInspector({ row, onClose }: Props) {
  if (!row) return null;

  return (
    <section className="cp-diagram-inspector rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-4 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--cp-text-muted)]">
            {STATUS_LABEL[row.status]}
          </p>
          <h3 className="truncate text-base font-semibold text-[var(--cp-text-primary)]">
            {row.label}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-[var(--cp-text-muted)] hover:bg-[var(--cp-surface-hover)]"
        >
          Close
        </button>
      </div>

      {row.evidence_chunks.length > 0 ? (
        <div className="mt-3 space-y-2">
          {row.evidence_chunks.map((chunk) => (
            <ChunkEvidenceCard
              key={chunk.chunk_id || chunk.snippet.slice(0, 24)}
              variant="full"
              chunk={{
                chunk_id: chunk.chunk_id,
                section_name: chunk.section_name,
                chunk_text: chunk.snippet,
                similarity: chunk.similarity,
              }}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-rose-700 dark:text-rose-300">
          Not in your CV.
        </p>
      )}

      {row.guidance ? (
        <p className="mt-2 text-xs text-[var(--cp-text-secondary)]">{row.guidance}</p>
      ) : null}
    </section>
  );
}
