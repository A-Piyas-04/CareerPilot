"use client";

import { Bookmark, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge, DrawerSkeleton, SpinnerButton } from "@/components/ui";
import { resumeOverlay } from "@/features/resume/resume-ui";
import {
  chipAmber,
  chipEmerald,
  fitScoreBadge,
  premiumCard,
  surfaceCardHeader,
} from "@/lib/ui-theme";

import { useMatchDetail, useSaveMatchToTracker } from "./hooks";
import { MatchJobActions } from "./match-job-actions";
import type { MatchSummary } from "./types";
import { getFitTier } from "./types";

type Props = {
  match: MatchSummary | null;
  onClose: () => void;
  onSaved?: (matchId: string, applicationId: string) => void;
};

export function MatchDetailDrawer({ match, onClose, onSaved }: Props) {
  const detailQuery = useMatchDetail(match?.match_id ?? null);
  const save = useSaveMatchToTracker();
  const [savedApplicationId, setSavedApplicationId] = useState<string | null>(null);
  const [showFullJd, setShowFullJd] = useState(false);

  useEffect(() => {
    setSavedApplicationId(match?.tracker_application_id ?? null);
    setShowFullJd(false);
  }, [match?.match_id, match?.tracker_application_id]);

  if (!match) {
    return null;
  }

  const source = detailQuery.data ?? match;
  const tier = getFitTier(source.fit_score);
  const fitTierKey =
    source.fit_score >= 75 ? "high" : source.fit_score >= 50 ? "medium" : "low";
  const isSaved = Boolean(savedApplicationId ?? source.tracker_application_id);
  const description = source.job.description ?? "No description available.";
  const jdPreview =
    description.length > 600 && !showFullJd
      ? `${description.slice(0, 600).trim()}…`
      : description;

  function handleSave() {
    if (!source.match_id) return;
    save.mutate(source.match_id, {
      onSuccess: (result) => {
        setSavedApplicationId(result.id);
        onSaved?.(source.match_id!, result.id);
        toast.success(
          result.already_saved ? "Already in your tracker." : "Saved to tracker.",
        );
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <div className={resumeOverlay}>
      <aside className="ml-auto flex h-full w-full max-w-2xl flex-col bg-gradient-to-b from-white via-white to-emerald-50/30 shadow-2xl shadow-emerald-950/10 ring-1 ring-emerald-900/[0.06]">
        <header className={`flex h-auto min-h-16 items-center justify-between px-5 py-4 ${surfaceCardHeader("emerald")}`}>
          <div className="min-w-0 pr-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Match details
            </p>
            <h2 className="truncate text-lg font-semibold text-zinc-950">
              {source.job.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/80 hover:text-zinc-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {detailQuery.isLoading ? (
            <DrawerSkeleton />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className={`flex h-14 w-14 flex-col items-center justify-center rounded-full ${fitScoreBadge(fitTierKey)}`}
                >
                  <span className="text-lg font-bold">{source.fit_score.toFixed(0)}</span>
                </div>
                <div>
                  <Badge
                    tone={
                      fitTierKey === "high"
                        ? "fitScore"
                        : fitTierKey === "medium"
                          ? "sky"
                          : "amber"
                    }
                  >
                    {tier.label}
                  </Badge>
                  <p className="mt-1 text-sm text-zinc-600">{source.explanation}</p>
                </div>
              </div>

              <MetaBlock job={source.job} />

              <section>
                <h3 className="text-sm font-semibold text-zinc-900">Skill fit</h3>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <ChipList title="Matched" items={source.matched_skills} tone="green" />
                  <ChipList title="Gaps" items={source.missing_skills} tone="amber" />
                </div>
              </section>

              {source.evidence_chunks.length > 0 ? (
                <section>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    CV evidence used
                  </h3>
                  <div className="mt-2 space-y-2">
                    {source.evidence_chunks.map((chunk) => (
                      <div
                        key={chunk.chunk_id ?? chunk.snippet.slice(0, 24)}
                        className={`${premiumCard} p-3 text-sm`}
                      >
                        <p className="font-medium text-zinc-900">
                          {chunk.section_name}
                          {chunk.similarity > 0
                            ? ` · ${Math.round(chunk.similarity * 100)}% similar`
                            : ""}
                        </p>
                        <p className="mt-1 text-zinc-600">{chunk.snippet}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <section>
                <h3 className="text-sm font-semibold text-zinc-900">Job description</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                  {jdPreview}
                </p>
                {description.length > 600 ? (
                  <button
                    type="button"
                    onClick={() => setShowFullJd((value) => !value)}
                    className="mt-2 text-sm font-medium text-emerald-700 hover:underline"
                  >
                    {showFullJd ? "Show less" : "Show full description"}
                  </button>
                ) : null}
              </section>
            </div>
          )}
        </div>

        <footer className="space-y-3 border-t border-emerald-100/80 bg-white/80 p-5 backdrop-blur-sm">
          <MatchJobActions
            match={source}
            applicationId={savedApplicationId ?? source.tracker_application_id}
            variant="full"
          />
          <div className="flex flex-wrap gap-2">
          {isSaved ? (
            <Link
              href="/tracker"
              className="flex h-10 items-center rounded-md border border-emerald-300 bg-emerald-50 px-4 text-sm font-medium text-emerald-800"
            >
              Open in Tracker
            </Link>
          ) : (
            <SpinnerButton
              type="button"
              variant="emerald"
              loading={save.isPending}
              loadingLabel="Saving…"
              onClick={handleSave}
              disabled={save.isPending || !source.match_id}
              icon={<Bookmark className="h-4 w-4" />}
              className="h-10 px-4"
            >
              Save to Tracker
            </SpinnerButton>
          )}
          {source.job.source_url ? (
            <a
              href={source.job.source_url}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 items-center gap-2 rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <ExternalLink className="h-4 w-4" />
              View posting
            </a>
          ) : null}
          </div>
        </footer>
      </aside>
    </div>
  );
}

function MetaBlock({ job }: { job: MatchSummary["job"] }) {
  const rows = [
    ["Company", job.company ?? "Unknown"],
    ["Location", job.location ?? "Not listed"],
    ["Type", job.job_type ?? "Not listed"],
    ["Salary", job.salary_range ?? "Not listed"],
    ["Deadline", job.deadline ?? "Not provided"],
  ];

  return (
    <div className={`${premiumCard} p-4`}>
      <dl className="grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {label}
            </dt>
            <dd className="text-sm text-zinc-800">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ChipList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "green" | "amber";
}) {
  const chipClass = tone === "green" ? chipEmerald : chipAmber;

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/80 p-3 ring-1 ring-zinc-950/[0.02]">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      {items.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span key={item} className={chipClass}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">None detected</p>
      )}
    </div>
  );
}
