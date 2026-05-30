"use client";

import { Sparkles, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/layout";
import { EmptyState, Skeleton } from "@/components/ui";
import { useResumes } from "@/features/resume/hooks";
import { pickPrimaryResume } from "@/features/resume/types";
import { PAGE_RELATED_LINKS } from "@/lib/navigation-config";
import { alertWarning, surfaceCard } from "@/lib/ui-theme";

import { listMatches } from "./api";
import { JobSearchForm } from "./search-form";
import { ManualJobDrawer } from "./manual-job-drawer";
import { MatchCard } from "./match-card";
import { MatchDetailDrawer } from "./match-detail-drawer";
import { MatchFilters } from "./match-filters";
import { SearchHistoryPanel } from "./search-history-panel";
import type { JobSearchResponse, JobSearchSummary, MatchSummary } from "./types";
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
  const [searchPrefill, setSearchPrefill] = useState<{
    query: string;
    location?: string;
  } | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedResumeId) return;
    const preferred =
      readyResumes.find((resume) => resume.id === primary?.id) ?? readyResumes[0];
    if (preferred) {
      setSelectedResumeId(preferred.id);
    }
  }, [primary, readyResumes, selectedResumeId]);

  const currentMatches = currentSearch?.matches ?? [];
  const filteredMatches = useMemo(
    () => filterAndSortMatches(currentMatches, filters),
    [currentMatches, filters],
  );

  function handleSearchSuccess(result: JobSearchResponse) {
    setCurrentSearch(result);
    setFilters(DEFAULT_MATCH_FILTERS);
    setSearchPrefill(null);
    scrollToResults();
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

  async function handleViewHistoryResults(search: JobSearchSummary) {
    try {
      const matches = await listMatches({ search_id: search.id, limit: 50 });
      setCurrentSearch({ search_id: search.id, matches });
      setFilters(DEFAULT_MATCH_FILTERS);
      scrollToResults();
      toast.success(
        matches.length
          ? `Loaded ${matches.length} stored matches for this search.`
          : "No stored matches for this search.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load search results.",
      );
      throw error;
    }
  }

  function handleRerunHistorySearch(search: JobSearchSummary) {
    setSearchPrefill({
      query: search.query,
      location: search.location ?? undefined,
    });
    document.getElementById("job-search-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    toast.message("Search form prefilled — click Search jobs to run again.");
  }

  function scrollToResults() {
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <PageShell>
      <PageHeader
        accent="emerald"
        eyebrowText="Discover"
        icon={Sparkles}
        title="Job Hunter"
        description="Search live roles, see how each posting fits your CV, review skill gaps, and save strong matches to your application tracker."
        relatedLinks={PAGE_RELATED_LINKS["/jobs"]}
      >
        <ol className="grid gap-2 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step}
              className="rounded-lg border border-emerald-200/70 bg-gradient-to-r from-emerald-50/80 to-teal-50/60 px-3 py-2 text-sm text-zinc-700"
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
            key={
              searchPrefill
                ? `prefill-${searchPrefill.query}-${searchPrefill.location ?? ""}`
                : "job-search-default"
            }
            resumes={resumes}
            selectedResumeId={selectedResumeId}
            prefill={searchPrefill}
            onResumeChange={(resumeId) => {
              setSelectedResumeId(resumeId);
              setCurrentSearch(null);
            }}
            onSearchStart={() => setCurrentSearch(null)}
            onSearchSuccess={handleSearchSuccess}
            onOpenManual={() => setManualOpen(true)}
          />
        )}

        <div ref={resultsRef}>
          {currentMatches.length > 0 ? (
            <>
              <MatchFilters
                filters={filters}
                totalCount={currentMatches.length}
                filteredCount={filteredMatches.length}
                onChange={setFilters}
              />
              <div className="mt-4 flex flex-col gap-4">
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
            <EmptyState
              accent="emerald"
              icon={Search}
              title="Ready to hunt"
              description="Run a search above to see fit-scored job cards with matched skills, gaps, and save-to-tracker actions."
              variant="dashed"
            />
          )}
        </div>

        <SearchHistoryPanel
          onViewResults={handleViewHistoryResults}
          onRerunSearch={handleRerunHistorySearch}
        />
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
