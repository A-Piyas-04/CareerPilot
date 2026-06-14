"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DrawerSkeleton } from "@/components/ui";
import { MatchJobActions } from "@/features/jobs/match-job-actions";
import { useEvidenceMap, useMatchDetail } from "@/features/jobs/hooks";
import type { EvidenceMapFilter, MatchSummary } from "@/features/jobs/types";
import { pageContainerWide, pageShell } from "@/lib/ui-theme";

import { EvidenceElementDiagram } from "./EvidenceElementDiagram";
import { EvidenceMapEmptyState } from "./EvidenceMapEmptyState";
import { EvidenceMapSummaryBar } from "./EvidenceMapSummaryBar";
import { EvidenceNodeInspector } from "./EvidenceNodeInspector";
import { sortRequirements } from "./evidence-diagram-model";

type Props = { matchId: string };

function toMatchSummary(
  matchId: string,
  detail: MatchSummary | undefined,
  jobId: string,
  jobTitle: string,
  company: string | null,
  fitScore: number,
): MatchSummary | null {
  if (detail) return detail;
  if (!jobId) return null;
  return {
    match_id: matchId,
    job: {
      id: jobId,
      search_id: null,
      title: jobTitle,
      company,
      location: null,
      salary_range: null,
      job_type: null,
      deadline: null,
      description: null,
      requirements: null,
      source: null,
      source_url: null,
      raw_data: null,
      created_at: "",
    },
    fit_score: fitScore,
    matched_skills: [],
    missing_skills: [],
    explanation: "",
    evidence_chunks: [],
    skills_component: 0,
    mean_similarity: 0,
    tracker_application_id: null,
  };
}

export function EvidenceMapPageClient({ matchId }: Props) {
  const evidenceQuery = useEvidenceMap(matchId);
  const matchQuery = useMatchDetail(matchId);
  const [filter, setFilter] = useState<EvidenceMapFilter>("all");
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const data = evidenceQuery.data;

  const visibleRows = useMemo(() => {
    if (!data) return [];
    const pool =
      filter === "all" ? data.rows : data.rows.filter((r) => r.status === filter);
    return sortRequirements(pool);
  }, [data, filter]);

  const selectedRow = useMemo(
    () => data?.rows.find((r) => r.id === selectedRowId) ?? null,
    [data, selectedRowId],
  );

  useEffect(() => {
    if (!data?.rows.length) {
      setSelectedRowId(null);
      return;
    }
    if (visibleRows.some((r) => r.id === selectedRowId)) return;
    const next = visibleRows.find((r) => r.status === "missing") ?? visibleRows[0];
    setSelectedRowId(next?.id ?? null);
  }, [data, visibleRows, selectedRowId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visibleRows.length) return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const idx = visibleRows.findIndex((r) => r.id === selectedRowId);
      const next =
        e.key === "ArrowDown"
          ? visibleRows[Math.min(idx + 1, visibleRows.length - 1)]
          : visibleRows[Math.max(idx - 1, 0)];
      if (next) setSelectedRowId(next.id);
    },
    [visibleRows, selectedRowId],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const matchSummary = toMatchSummary(
    matchId,
    matchQuery.data,
    data?.job.id ?? "",
    data?.job.title ?? "Job match",
    data?.job.company ?? null,
    data?.fit_score ?? 0,
  );

  return (
    <div className={pageShell}>
      <div className={pageContainerWide}>
        <Link
          href="/jobs"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>

        {evidenceQuery.isLoading ? (
          <div className="space-y-4">
            <DrawerSkeleton />
            <p className="text-center text-sm text-[var(--cp-text-muted)]">
              Building evidence map…
            </p>
          </div>
        ) : evidenceQuery.isError || !data ? (
          <EvidenceMapEmptyState reason={null} />
        ) : data.empty_reason || data.rows.length === 0 ? (
          <EvidenceMapEmptyState reason={data.empty_reason} />
        ) : (
          <div className="space-y-5">
            <EvidenceMapSummaryBar
              summary={data.summary}
              filter={filter}
              onFilterChange={setFilter}
              jobTitle={data.job.title}
              company={data.job.company}
              fitScore={data.fit_score}
            />

            <EvidenceElementDiagram
              rows={data.rows}
              fitScore={data.fit_score}
              filter={filter}
              selectedRowId={selectedRowId}
              onSelectRow={setSelectedRowId}
            />

            {selectedRow ? (
              <EvidenceNodeInspector
                row={selectedRow}
                onClose={() => setSelectedRowId(null)}
              />
            ) : null}

            {matchSummary ? (
              <footer className="flex flex-wrap gap-2 border-t border-[var(--cp-border)] pt-4">
                <MatchJobActions match={matchSummary} variant="full" />
              </footer>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
