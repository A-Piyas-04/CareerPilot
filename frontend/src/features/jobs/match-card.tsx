"use client";

import { Bookmark, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { SpinnerButton } from "@/components/ui";

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

function scoreLabel(score: number) {
  if (score >= 80) return "Strong fit";
  if (score >= 65) return "Good fit";
  if (score >= 45) return "Partial fit";
  return "Stretch role";
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
  const evidenceCount =
    typeof match.evidence_chunk_count === "number"
      ? match.evidence_chunk_count
      : Array.isArray(match.evidence_chunks)
        ? match.evidence_chunks.length
        : 0;
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
          {scoreLabel(match.fit_score)} - {match.fit_score.toFixed(0)}
        </span>
      </header>

      <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
        <p className="text-sm font-medium text-zinc-800">
          {match.recommendation || match.explanation}
        </p>
        {match.recommendation && match.explanation ? (
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {match.explanation}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-zinc-500">
          <span>{job.source || match.source || "CareerPilot match"}</span>
          <span>-</span>
          <span>
            {evidenceCount > 0
              ? `${evidenceCount} CV evidence ${
                  evidenceCount === 1 ? "chunk" : "chunks"
                }`
              : "CV evidence scored"}
          </span>
        </div>
      </div>

      {match.matched_skills.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Matched skills
          </p>
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
        </div>
      ) : null}

      {match.missing_skills.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Missing or weak skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {match.missing_skills.map((s) => (
              <span
                key={`x-${s}`}
                className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
              >
                {s}
              </span>
            ))}
          </div>
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
        <SpinnerButton
          type="button"
          variant="emerald"
          loading={save.isPending}
          loadingLabel="Saving…"
          onClick={handleSave}
          disabled={save.isPending || !match.match_id}
          icon={<Bookmark className="h-4 w-4" />}
          className="h-9 px-3"
        >
          Save to Tracker
        </SpinnerButton>
      </footer>
    </article>
  );
}
