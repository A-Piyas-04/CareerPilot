"use client";

import { Bookmark, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Badge, Card, SpinnerButton, buttonClassName } from "@/components/ui";

import { useSaveMatchToTracker } from "./hooks";
import type { MatchSummary } from "./types";

type Props = {
  match: MatchSummary;
};

function scoreTone(score: number): "success" | "warning" | "neutral" {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "neutral";
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
      toast.error("This match cannot be saved because it has no match id.");
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
    <Card as="article" className="p-4" interactive>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-[var(--foreground)]">
            {job.title}
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            {job.company ?? "Unknown company"}
            {job.location ? ` - ${job.location}` : ""}
            {job.job_type ? ` - ${job.job_type}` : ""}
          </p>
        </div>
        <Badge className="shrink-0" tone={scoreTone(match.fit_score)}>
          {scoreLabel(match.fit_score)} - {match.fit_score.toFixed(0)}
        </Badge>
      </header>

      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2">
        <p className="text-sm font-medium text-[var(--foreground)]">
          {match.recommendation || match.explanation}
        </p>
        {match.recommendation && match.explanation ? (
          <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
            {match.explanation}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-[var(--muted-foreground)]">
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
        <SkillGroup
          label="Matched skills"
          tone="success"
          skills={match.matched_skills}
        />
      ) : null}

      {match.missing_skills.length > 0 ? (
        <SkillGroup
          label="Missing or weak skills"
          tone="warning"
          skills={match.missing_skills}
        />
      ) : null}

      <footer className="mt-4 flex flex-wrap items-center gap-2">
        {job.source_url ? (
          <a
            href={job.source_url}
            target="_blank"
            rel="noreferrer"
            className={buttonClassName({ size: "sm", variant: "secondary" })}
          >
            <ExternalLink className="h-4 w-4" />
            View posting
          </a>
        ) : null}
        <SpinnerButton
          type="button"
          variant="emerald"
          loading={save.isPending}
          loadingLabel="Saving..."
          onClick={handleSave}
          disabled={save.isPending || !match.match_id}
          icon={<Bookmark className="h-4 w-4" />}
          className="h-9 px-3"
        >
          Save to Tracker
        </SpinnerButton>
      </footer>
    </Card>
  );
}

function SkillGroup({
  label,
  skills,
  tone,
}: {
  label: string;
  skills: string[];
  tone: "success" | "warning";
}) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <Badge key={skill} tone={tone}>
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
}
