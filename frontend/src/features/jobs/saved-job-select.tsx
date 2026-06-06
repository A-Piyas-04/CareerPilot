"use client";

import Link from "next/link";

import type { MatchSummary } from "@/features/jobs/types";
import { formatSavedJobOption } from "@/features/jobs/job-prefill";
import { suppressExtensionHydrationProps } from "@/lib/hydration";
import { inputFieldSky } from "@/lib/ui-theme";

type SavedJobSelectProps = {
  disabled?: boolean;
  error?: string | null;
  isLoading?: boolean;
  onChange: (jobId: string) => void;
  savedJobs: MatchSummary[];
  value: string;
};

export function SavedJobSelect({
  disabled = false,
  error,
  isLoading = false,
  onChange,
  savedJobs,
  value,
}: SavedJobSelectProps) {
  return (
    <div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-800">
          Load from saved jobs
        </span>
        <select
          {...suppressExtensionHydrationProps}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputFieldSky}
          disabled={disabled || isLoading}
        >
          <option value="">Enter role manually</option>
          {savedJobs.map((match) => (
            <option key={match.job.id} value={match.job.id}>
              {formatSavedJobOption(match)}
            </option>
          ))}
        </select>
      </label>
      {isLoading ? (
        <p className="mt-2 text-sm text-zinc-500">Loading saved jobs…</p>
      ) : error ? (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      ) : savedJobs.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">
          No saved jobs yet. Save roles from{" "}
          <Link href="/jobs" className="font-medium text-sky-700 hover:underline">
            Job Hunter
          </Link>{" "}
          to load them here.
        </p>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">
          Pick a job you saved to your tracker to prefill the role and description.
        </p>
      )}
    </div>
  );
}
