"use client";

import type { EvidenceMapFilter, EvidenceMapSummary } from "@/features/jobs/types";

type Props = {
  summary: EvidenceMapSummary;
  filter: EvidenceMapFilter;
  onFilterChange: (filter: EvidenceMapFilter) => void;
  jobTitle: string;
  company: string | null;
  fitScore: number;
};

const FILTERS: { key: EvidenceMapFilter; label: string; countKey?: keyof EvidenceMapSummary }[] = [
  { key: "all", label: "All" },
  { key: "strong", label: "Strong", countKey: "strong_count" },
  { key: "weak", label: "Weak", countKey: "weak_count" },
  { key: "missing", label: "Gap", countKey: "missing_count" },
];

export function EvidenceMapSummaryBar({
  summary,
  filter,
  onFilterChange,
  jobTitle,
  company,
  fitScore,
}: Props) {
  const tier = fitScore >= 75 ? "high" : fitScore >= 50 ? "medium" : "low";
  const tierColor =
    tier === "high"
      ? "text-emerald-700 dark:text-emerald-300"
      : tier === "medium"
        ? "text-sky-700 dark:text-sky-300"
        : "text-amber-700 dark:text-amber-300";

  return (
    <header className="flex flex-col gap-3 rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-surface)] px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-[var(--cp-text-primary)]">
            {jobTitle}
            {company ? (
              <span className="font-normal text-[var(--cp-text-muted)]"> @ {company}</span>
            ) : null}
          </h1>
          <p className="mt-0.5 text-xs text-[var(--cp-text-muted)]">
            Evidence flow map · click a requirement to inspect CV evidence
          </p>
        </div>
        <div className={`shrink-0 text-right ${tierColor}`}>
          <p className="text-3xl font-black leading-none">{Math.round(fitScore)}%</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest opacity-80">Fit Score</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => {
          const active = filter === item.key;
          const count =
            item.key === "all"
              ? summary.total_requirements
              : item.countKey
                ? summary[item.countKey]
                : 0;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onFilterChange(item.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                active
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-[var(--cp-surface-muted)] text-[var(--cp-text-secondary)] ring-1 ring-[var(--cp-border)] hover:bg-[var(--cp-surface-hover)]"
              }`}
            >
              {item.label} ({count})
            </button>
          );
        })}
        <span className="ml-auto text-xs text-[var(--cp-text-muted)]">
          {summary.strong_count}/{summary.total_requirements} grounded
        </span>
      </div>
    </header>
  );
}
