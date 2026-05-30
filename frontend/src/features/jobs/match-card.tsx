"use client";

import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { SpinnerButton } from "@/components/ui";

import { useSaveMatchToTracker } from "./hooks";
import { MatchJobActions } from "./match-job-actions";
import type { MatchSummary } from "./types";
import { getFitTier } from "./types";

type Props = {
  match: MatchSummary;
  onOpenDetails: (match: MatchSummary) => void;
  onSaved?: (matchId: string, applicationId: string) => void;
};

export function MatchCard({ match, onOpenDetails, onSaved }: Props) {
  const save = useSaveMatchToTracker();
  const [expanded, setExpanded] = useState(false);
  const [savedApplicationId, setSavedApplicationId] = useState<string | null>(
    match.tracker_application_id,
  );

  const tier = getFitTier(match.fit_score);
  const isSaved = Boolean(savedApplicationId);

  function handleSave() {
    if (!match.match_id) {
      toast.error("This match cannot be saved (no match id).");
      return;
    }
    save.mutate(match.match_id, {
      onSuccess: (result) => {
        setSavedApplicationId(result.id);
        onSaved?.(match.match_id!, result.id);
        toast.success(
          result.already_saved
            ? "Already in your tracker."
            : "Saved to tracker.",
        );
      },
      onError: (error) => toast.error(error.message),
    });
  }

  const { job } = match;
  const skillsPercent = Math.round((match.skills_component || 0) * 100);
  const similarityPercent = Math.round((match.mean_similarity || 0) * 100);

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-start gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 ${tier.className}`}
          aria-label={`Fit score ${match.fit_score}`}
        >
          <span className="text-xl font-bold leading-none">
            {match.fit_score.toFixed(0)}
          </span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase">Fit</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-zinc-950">{job.title}</h3>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${tier.className}`}
            >
              {tier.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600">
            {[job.company, job.location, job.job_type].filter(Boolean).join(" · ") ||
              "Details limited"}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span>
              Salary:{" "}
              <strong className="font-medium text-zinc-700">
                {job.salary_range ?? "Not listed"}
              </strong>
            </span>
            <span>
              Deadline:{" "}
              <strong className="font-medium text-zinc-700">
                {job.deadline ?? "Not provided"}
              </strong>
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <SkillGroup
          title={`You have (${match.matched_skills.length})`}
          skills={match.matched_skills}
          variant="matched"
        />
        <SkillGroup
          title={`Gaps (${match.missing_skills.length})`}
          skills={match.missing_skills}
          variant="missing"
        />
      </div>

      <div className="rounded-lg border border-zinc-100 bg-zinc-50">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-zinc-800"
        >
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4 text-emerald-700" />
            Why this match
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          )}
        </button>
        {expanded ? (
          <div className="space-y-3 border-t border-zinc-100 px-4 py-3 text-sm text-zinc-700">
            <p>{match.explanation}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <ScoreBar label="Skills overlap" value={skillsPercent} />
              <ScoreBar label="CV similarity" value={similarityPercent} />
            </div>
            {match.evidence_chunks.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  CV evidence
                </p>
                {match.evidence_chunks.slice(0, 3).map((chunk) => (
                  <div
                    key={chunk.chunk_id ?? chunk.snippet.slice(0, 20)}
                    className="rounded-md border border-zinc-200 bg-white p-2 text-xs text-zinc-600"
                  >
                    <p className="font-medium text-zinc-800">
                      {chunk.section_name}
                      {chunk.similarity > 0
                        ? ` · ${Math.round(chunk.similarity * 100)}% match`
                        : ""}
                    </p>
                    <p className="mt-1 line-clamp-3">{chunk.snippet}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <MatchJobActions
        match={match}
        applicationId={savedApplicationId}
        variant="compact"
      />

      <footer className="flex flex-wrap items-center gap-2">
        {isSaved ? (
          <Link
            href="/tracker"
            className="flex h-9 items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-3 text-sm font-medium text-emerald-800"
          >
            <BookmarkCheck className="h-4 w-4" />
            In Tracker
          </Link>
        ) : (
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
        )}
        <button
          type="button"
          onClick={() => onOpenDetails(match)}
          className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Match details
        </button>
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
      </footer>
    </article>
  );
}

function SkillGroup({
  title,
  skills,
  variant,
}: {
  title: string;
  skills: string[];
  variant: "matched" | "missing";
}) {
  const chipClass =
    variant === "matched"
      ? "bg-emerald-50 text-emerald-800"
      : "bg-amber-50 text-amber-900";

  return (
    <div className="rounded-lg border border-zinc-100 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      {skills.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.slice(0, 8).map((skill) => (
            <span
              key={skill}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${chipClass}`}
            >
              {skill}
            </span>
          ))}
          {skills.length > 8 ? (
            <span className="text-xs text-zinc-500">+{skills.length - 8} more</span>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">
          {variant === "matched" ? "No overlapping skills detected." : "No gaps detected."}
        </p>
      )}
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-zinc-600">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
