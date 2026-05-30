"use client";

import { LineChart } from "lucide-react";

import { EmptyState } from "@/components/ui";
import type { SkillGapAnalysisSummary } from "@/lib/career-api";
import { alertError } from "@/lib/ui-theme";

type Props = {
  analyses: SkillGapAnalysisSummary[];
  selectedId: string | null;
  isLoading: boolean;
  error?: string;
  onSelect: (id: string) => void;
};

export function SkillGapList({
  analyses,
  selectedId,
  isLoading,
  error,
  onSelect,
}: Props) {
  if (isLoading) {
    return <p className="text-sm text-zinc-500">Loading analyses…</p>;
  }

  if (error) {
    return <p className={alertError}>{error}</p>;
  }

  if (!analyses.length) {
    return (
      <EmptyState
        accent="sky"
        className="min-h-48 py-8"
        description="Run your first skill gap check using the form on the left."
        icon={LineChart}
        title="No analyses yet"
      />
    );
  }

  return (
    <ul className="space-y-2">
      {analyses.map((analysis) => {
        const isActive = analysis.id === selectedId;
        return (
          <li key={analysis.id}>
            <button
              type="button"
              onClick={() => onSelect(analysis.id)}
              className={`w-full rounded-md border px-3 py-2 text-left transition ${
                isActive
                  ? "border-sky-300 bg-sky-50 ring-1 ring-sky-200/60"
                  : "border-zinc-200 bg-white hover:border-sky-200 hover:bg-sky-50/50"
              }`}
            >
              <p className="text-sm font-medium text-zinc-900">
                {analysis.target_role ?? "Untitled role"}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {analysis.missing_skills.length} gaps ·{" "}
                {formatDate(analysis.created_at)}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
