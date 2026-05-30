"use client";

import { useMemo, useState } from "react";

import { ListCardSkeleton, Skeleton } from "@/components/ui";
import { useResumes } from "@/features/resume/hooks";
import { pickPrimaryResume } from "@/features/resume/types";

import { JobSearchForm } from "./search-form";
import { MatchCard } from "./match-card";
import { useJobMatches } from "./hooks";

export function JobsPageClient() {
  const resumesQuery = useResumes();
  const resumes = resumesQuery.data ?? [];
  const primary = useMemo(() => pickPrimaryResume(resumes), [resumes]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(
    primary?.id ?? null,
  );

  if (!selectedResumeId && primary) {
    setSelectedResumeId(primary.id);
  }

  const matchesQuery = useJobMatches(selectedResumeId);

  return (
    <main className="flex min-h-screen flex-col bg-[#f6f7f9]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              CareerPilot
            </p>
            <h1 className="text-2xl font-semibold text-zinc-950">Job Hunter</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-5 px-5 py-5">
        {resumesQuery.isLoading ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : resumes.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Upload a CV on the{" "}
            <a className="font-semibold underline" href="/resume">
              CV Intelligence
            </a>{" "}
            page first — the agent needs one to compute fit scores.
          </div>
        ) : (
          <JobSearchForm
            resumes={resumes}
            selectedResumeId={selectedResumeId}
            onResumeChange={setSelectedResumeId}
          />
        )}

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Matches
          </h2>

          {matchesQuery.isLoading ? (
            <ListCardSkeleton count={3} cardClassName="h-32" className="space-y-3" />
          ) : matchesQuery.error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {matchesQuery.error.message}
            </div>
          ) : (matchesQuery.data ?? []).length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-600">
              No matches yet. Run a search above to discover jobs.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {(matchesQuery.data ?? []).map((m) => (
                <MatchCard key={m.match_id ?? m.job.id} match={m} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
