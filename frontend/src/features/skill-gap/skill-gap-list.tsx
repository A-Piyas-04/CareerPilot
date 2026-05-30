"use client";

import type { SkillGapAnalysisSummary } from "@/lib/career-api";

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
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!analyses.length) {
    return (
      <p className="text-sm text-zinc-500">
        No analyses yet. Run your first skill gap check on the left.
      </p>
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
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-zinc-200 bg-white hover:bg-zinc-50"
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
