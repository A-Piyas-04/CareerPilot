"use client";

import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PageHeader, PageShell } from "@/components/layout";
import { ListCardSkeleton, Skeleton } from "@/components/ui";
import { useResumes } from "@/features/resume/hooks";
import { pickPrimaryResume } from "@/features/resume/types";
import { PAGE_RELATED_LINKS } from "@/lib/navigation-config";
import { alertWarning, surfaceCard } from "@/lib/ui-theme";

import { JobSearchForm } from "./search-form";
import { ManualJobDrawer } from "./manual-job-drawer";
import { MatchCard } from "./match-card";
import { MatchDetailDrawer } from "./match-detail-drawer";
import { MatchFilters } from "./match-filters";
import { useJobMatches } from "./hooks";
import type { JobSearchResponse, MatchSummary } from "./types";
import {
  DEFAULT_MATCH_FILTERS,
  filterAndSortMatches,
  type MatchFilterState,
} from "./types";

const STEPS = [
  "Pick a processed CV",
  "Search or paste a job description",
  "Review fit, gaps, and save to tracker",
];

export function JobsPageClient() {
  const resumesQuery = useResumes();
  const resumes = useMemo(() => resumesQuery.data ?? [], [resumesQuery.data]);
  const primary = useMemo(() => pickPrimaryResume(resumes), [resumes]);
  const readyResumes = useMemo(
    () => resumes.filter((resume) => resume.status === "processed"),
    [resumes],
  );

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [currentSearch, setCurrentSearch] = useState<JobSearchResponse | null>(null);
  const [filters, setFilters] = useState<MatchFilterState>(DEFAULT_MATCH_FILTERS);
  const [detailMatch, setDetailMatch] = useState<MatchSummary | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [previousOpen, setPreviousOpen] = useState(false);

  useEffect(() => {
    if (selectedResumeId) return;
    const preferred =
      readyResumes.find((resume) => resume.id === primary?.id) ?? readyResumes[0];
    if (preferred) {
      setSelectedResumeId(preferred.id);
    }
  }, [primary, readyResumes, selectedResumeId]);

  const previousMatchesQuery = useJobMatches(selectedResumeId, {
    enabled: previousOpen,
  });

  const currentMatches = currentSearch?.matches ?? [];
  const filteredMatches = useMemo(
    () => filterAndSortMatches(currentMatches, filters),
    [currentMatches, filters],
  );

  function handleSearchSuccess(result: JobSearchResponse) {
    setCurrentSearch(result);
    setFilters(DEFAULT_MATCH_FILTERS);
    setPreviousOpen(false);
  }

  function handleManualSuccess(_searchId: string, match: MatchSummary) {
    setCurrentSearch({
      search_id: match.job.search_id ?? "manual",
      matches: [match],
    });
    setFilters(DEFAULT_MATCH_FILTERS);
  }

  function handleMatchSaved(matchId: string, applicationId: string) {
    setCurrentSearch((current) => {
      if (!current) return current;
      return {
        ...current,
        matches: current.matches.map((match) =>
          match.match_id === matchId
            ? { ...match, tracker_application_id: applicationId }
            : match,
        ),
      };
    });
  }

  const previousMatches = (previousMatchesQuery.data ?? []).filter((match) => {
    if (!currentSearch?.search_id) return true;
    return match.job.search_id !== currentSearch.search_id;
  });

  return (
    <PageShell>
      <PageHeader
        icon={Sparkles}
        title="Job Hunter"
        description="Search live roles, see how each posting fits your CV, review skill gaps, and save strong matches to your application tracker."
        relatedLinks={PAGE_RELATED_LINKS["/jobs"]}
      >
        <ol className="grid gap-2 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step}
              className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm text-zinc-700"
            >
              <span className="mr-2 font-semibold text-emerald-700">
                {index + 1}.
              </span>
              {step}
            </li>
          ))}
        </ol>
      </PageHeader>

      <div className="flex flex-col gap-5">
        {resumesQuery.isLoading ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : resumes.length === 0 ? (
          <div className={alertWarning}>
            Upload a CV on the{" "}
            <a className="font-semibold underline" href="/resume">
              CV Intelligence
            </a>{" "}
            page first — Job Hunter needs an indexed CV to compute fit scores.
          </div>
        ) : (
          <JobSearchForm
            resumes={resumes}
            selectedResumeId={selectedResumeId}
            onResumeChange={(resumeId) => {
              setSelectedResumeId(resumeId);
              setCurrentSearch(null);
            }}
            onSearchStart={() => setCurrentSearch(null)}
            onSearchSuccess={handleSearchSuccess}
            onOpenManual={() => setManualOpen(true)}
          />
        )}

        {currentMatches.length > 0 ? (
          <>
            <MatchFilters
              filters={filters}
              totalCount={currentMatches.length}
              filteredCount={filteredMatches.length}
              onChange={setFilters}
            />
            <div className="flex flex-col gap-4">
              {filteredMatches.map((match) => (
                <MatchCard
                  key={match.match_id ?? match.job.id}
                  match={match}
                  onOpenDetails={setDetailMatch}
                  onSaved={handleMatchSaved}
                />
              ))}
              {filteredMatches.length === 0 ? (
                <div className={`${surfaceCard} p-6 text-center text-sm text-zinc-600`}>
                  No jobs match your current filters. Try lowering the minimum fit
                  score or clearing quick filters.
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className={`${surfaceCard} border-dashed p-8 text-center text-sm text-zinc-600`}>
            Run a search above to see fit-scored job cards here.
          </div>
        )}

        <div className={surfaceCard}>
          <button
            type="button"
            onClick={() => setPreviousOpen((value) => !value)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-zinc-800"
          >
            Previous matches from earlier searches
            {previousOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {previousOpen ? (
            <div className="space-y-3 border-t border-zinc-100 p-4">
              {previousMatchesQuery.isLoading ? (
                <ListCardSkeleton count={2} cardClassName="h-28" />
              ) : previousMatches.length === 0 ? (
                <p className="text-sm text-zinc-500">No earlier matches stored yet.</p>
              ) : (
                previousMatches.map((match) => (
                  <MatchCard
                    key={`prev-${match.match_id ?? match.job.id}`}
                    match={match}
                    onOpenDetails={setDetailMatch}
                    onSaved={handleMatchSaved}
                  />
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>

      <MatchDetailDrawer
        match={detailMatch}
        onClose={() => setDetailMatch(null)}
        onSaved={handleMatchSaved}
      />
      <ManualJobDrawer
        open={manualOpen}
        resumeId={selectedResumeId}
        onClose={() => setManualOpen(false)}
        onSuccess={handleManualSuccess}
      />
    </PageShell>
  );
}
