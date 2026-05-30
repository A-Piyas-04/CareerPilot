"use client";

import type { MatchFilterState, MatchSortOption } from "./types";

type Props = {
  filters: MatchFilterState;
  totalCount: number;
  filteredCount: number;
  onChange: (next: MatchFilterState) => void;
};

const SORT_OPTIONS: { value: MatchSortOption; label: string }[] = [
  { value: "fit_score", label: "Fit score" },
  { value: "company", label: "Company A–Z" },
  { value: "title", label: "Title A–Z" },
];

export function MatchFilters({
  filters,
  totalCount,
  filteredCount,
  onChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-600">
          Showing{" "}
          <span className="font-semibold text-zinc-900">{filteredCount}</span> of{" "}
          <span className="font-semibold text-zinc-900">{totalCount}</span> jobs
        </p>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          Sort
          <select
            value={filters.sort}
            onChange={(event) =>
              onChange({
                ...filters,
                sort: event.target.value as MatchSortOption,
              })
            }
            className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Minimum fit score: {filters.minScore}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={filters.minScore}
          onChange={(event) =>
            onChange({ ...filters, minScore: Number(event.target.value) })
          }
          className="w-full accent-emerald-600"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={filters.strongOnly}
          onClick={() =>
            onChange({ ...filters, strongOnly: !filters.strongOnly })
          }
          label="Strong matches (≥75)"
        />
        <FilterChip
          active={filters.hasGapsOnly}
          onClick={() =>
            onChange({ ...filters, hasGapsOnly: !filters.hasGapsOnly })
          }
          label="Has skill gaps"
        />
        <FilterChip
          active={filters.notSavedOnly}
          onClick={() =>
            onChange({ ...filters, notSavedOnly: !filters.notSavedOnly })
          }
          label="Not saved yet"
        />
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
          : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
      }`}
    >
      {label}
    </button>
  );
}
