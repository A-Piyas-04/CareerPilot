"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, ListCardSkeleton, PageHeader, Skeleton } from "@/components/ui";
import { useResumes } from "@/features/resume/hooks";
import { pickPrimaryResume } from "@/features/resume/types";

import { JobSearchForm } from "./search-form";
import { MatchCard } from "./match-card";
import { useJobMatches } from "./hooks";

export function JobsPageClient() {
  const resumesQuery = useResumes();
  const resumes = useMemo(() => resumesQuery.data ?? [], [resumesQuery.data]);
  const primary = useMemo(() => pickPrimaryResume(resumes), [resumes]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(
    primary?.id ?? null,
  );

  if (!selectedResumeId && primary) {
    setSelectedResumeId(primary.id);
  }

  const matchesQuery = useJobMatches(selectedResumeId);

  return (
    <main className="cp-page">
      <section className="cp-container flex flex-1 flex-col gap-6 py-6">
        <PageHeader
          eyebrow="Match engine"
          icon={Search}
          title="Job Hunter"
          description="Search the market, score roles against your CV, and save promising matches into your tracker."
        />

        {resumesQuery.isLoading ? (
          <Skeleton className="h-32 rounded-[var(--radius-md)]" />
        ) : resumes.length === 0 ? (
          <EmptyState
            title="Add a CV before searching"
            description="The match engine needs a parsed CV to compute fit scores and evidence."
            action={
              <a
                className="text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
                href="/resume"
              >
                Open CV Intelligence
              </a>
            }
          />
        ) : (
          <JobSearchForm
            resumes={resumes}
            selectedResumeId={selectedResumeId}
            onResumeChange={setSelectedResumeId}
          />
        )}

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            Matches
          </h2>

          {matchesQuery.isLoading ? (
            <ListCardSkeleton count={3} cardClassName="h-40" className="space-y-3" />
          ) : matchesQuery.error ? (
            <div className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
              {matchesQuery.error.message}
            </div>
          ) : (matchesQuery.data ?? []).length === 0 ? (
            <EmptyState
              title="No matches yet"
              description="Run a search above to discover jobs scored against your selected resume."
            />
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
