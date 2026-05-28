"use client";

import { Bookmark, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { useSaveMatchToTracker } from "./hooks";
import type { MatchSummary } from "./types";

type Props = {
  match: MatchSummary;
};

function scoreBadgeClass(score: number) {
  if (score >= 75) return "bg-emerald-100 text-emerald-800";
  if (score >= 50) return "bg-amber-100 text-amber-800";
  return "bg-zinc-100 text-zinc-700";
}

export function MatchCard({ match }: Props) {
  const save = useSaveMatchToTracker();

  function handleSave() {
    if (!match.match_id) {
      toast.error("This match cannot be saved (no match id).");
      return;
    }
    save.mutate(match.match_id, {
      onSuccess: () => toast.success("Saved to tracker."),
      onError: (error) => toast.error(error.message),
    });
  }

  const { job } = match;
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-zinc-900">{job.title}</h3>
          <p className="text-sm text-zinc-600">
            {job.company ?? "Unknown company"}
            {job.location ? ` · ${job.location}` : ""}
            {job.job_type ? ` · ${job.job_type}` : ""}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${scoreBadgeClass(match.fit_score)}`}
        >
          Fit {match.fit_score.toFixed(0)}
        </span>
      </header>

      <p className="text-sm text-zinc-700">{match.explanation}</p>

      {match.matched_skills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {match.matched_skills.map((s) => (
            <span
              key={`m-${s}`}
              className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800"
            >
              {s}
            </span>
          ))}
        </div>
      ) : null}

      {match.missing_skills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {match.missing_skills.map((s) => (
            <span
              key={`x-${s}`}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600"
            >
              {s} missing
            </span>
          ))}
        </div>
      ) : null}

      <footer className="mt-1 flex items-center gap-2">
        {job.source_url ? (
          <a
            href={job.source_url}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            <ExternalLink className="h-4 w-4" />
            View posting
          </a>
        ) : null}
        <button
          type="button"
          onClick={handleSave}
          disabled={save.isPending || !match.match_id}
          className="flex h-9 items-center gap-1.5 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-400"
        >
          <Bookmark className="h-4 w-4" />
          {save.isPending ? "Saving…" : "Save to Tracker"}
        </button>
      </footer>
    </article>
  );
}
