"use client";

import { FileText, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SpinnerButton } from "@/components/ui";
import type { Resume } from "@/features/resume/types";
import {
  chipSky,
  formHintPanel,
  formHintPanelEmerald,
  formPanel,
  inputField,
} from "@/lib/ui-theme";

import { useSearchJobs } from "./hooks";
import { normalizeJobSearchInput } from "./search-query";

const EXAMPLE_QUERIES = [
  "Python backend engineer",
  "ML internships in Dhaka",
  "Remote data analyst",
];

const RESULT_LIMITS = [10, 20, 25] as const;

type SearchPrefill = {
  query: string;
  location?: string;
};

type Props = {
  resumes: Resume[];
  resumesLoading?: boolean;
  selectedResumeId: string | null;
  prefill?: SearchPrefill | null;
  onResumeChange: (resumeId: string) => void;
  onSearchStart: () => void;
  onSearchSuccess: (result: import("./types").JobSearchResponse) => void;
  onOpenManual: () => void;
};

export function JobSearchForm({
  resumes,
  resumesLoading = false,
  selectedResumeId,
  prefill,
  onResumeChange,
  onSearchStart,
  onSearchSuccess,
  onOpenManual,
}: Props) {
  const [query, setQuery] = useState(prefill?.query ?? "");
  const [location, setLocation] = useState(prefill?.location ?? "");
  const [limit, setLimit] = useState<number>(20);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const search = useSearchJobs();

  const readyResumes = resumes.filter(
    (resume) => resume.status === "processed",
  );
  const searchStep = elapsedSeconds >= 3 ? "scoring" : "fetching";

  useEffect(() => {
    if (!search.isPending) {
      return;
    }

    const elapsedTimer = window.setInterval(
      () => setElapsedSeconds((value) => value + 1),
      1000,
    );

    return () => {
      window.clearInterval(elapsedTimer);
    };
  }, [search.isPending]);

  useEffect(() => {
    if (search.isPending && elapsedSeconds === 15) {
      toast.message("Scoring many jobs against your CV — almost done.");
    }
  }, [elapsedSeconds, search.isPending]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedResumeId) {
      toast.error("Pick a processed CV to match against.");
      return;
    }
    if (!query.trim()) {
      toast.error("Enter a search query.");
      return;
    }

    const normalized = normalizeJobSearchInput({
      query: query.trim(),
      location,
    });

    onSearchStart();
    setElapsedSeconds(0);
    search.mutate(
      {
        query: normalized.query,
        location: normalized.location,
        source: "jsearch",
        resume_id: selectedResumeId,
        limit,
      },
      {
        onSuccess: (result) => {
          onSearchSuccess(result);
          toast.success(`Found ${result.matches.length} scored matches.`);
        },
        onError: (error) => toast.error(error.message),
        onSettled: () => setElapsedSeconds(0),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <TabButton active label="Search jobs" />
        <TabButton
          active={false}
          label="Paste a posting"
          onClick={onOpenManual}
        />
      </div>

      <form
        id="job-search-form"
        onSubmit={handleSubmit}
        className={`${formPanel} flex flex-col gap-4 border-emerald-200/70 bg-gradient-to-br from-white via-emerald-50/25 to-sky-50/30 ring-emerald-900/[0.04]`}
      >
        <div>
          <label className="text-sm font-medium text-zinc-900">
            What kind of role are you looking for?
          </label>
          <input
            type="text"
            placeholder='e.g. "ML internships in Dhaka open this month"'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={`${inputField} mt-2 h-11`}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_160px]">
          <input
            type="text"
            placeholder="Optional location (e.g. Berlin)"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className={`${inputField} h-10`}
          />
          <select
            value={selectedResumeId ?? ""}
            onChange={(event) => onResumeChange(event.target.value)}
            disabled={resumesLoading}
            className={`${inputField} h-10 disabled:cursor-wait disabled:opacity-70`}
          >
            <option value="" disabled>
              {resumesLoading ? "Loading CVs…" : "Match against CV…"}
            </option>
            {readyResumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.file_name}
              </option>
            ))}
          </select>
          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            className={`${inputField} h-10`}
          >
            {RESULT_LIMITS.map((value) => (
              <option key={value} value={value}>
                {value} results
              </option>
            ))}
          </select>
        </div>

        {search.isPending ? (
          <div className={formHintPanelEmerald}>
            <p className="font-medium">
              {searchStep === "fetching"
                ? "Step 1/2 — Fetching jobs from JSearch…"
                : "Step 2/2 — Scoring fit against your CV…"}
            </p>
            <p className="mt-1 text-xs opacity-90">
              {elapsedSeconds > 0 ? `${elapsedSeconds}s elapsed · ` : ""}
              Scoring up to {limit} postings
            </p>
          </div>
        ) : null}

        <SpinnerButton
          type="submit"
          variant="emerald"
          loading={search.isPending}
          loadingLabel="Searching…"
          icon={<Search className="h-4 w-4" />}
          className="h-11 w-full md:w-auto md:min-w-[180px]"
        >
          Search jobs
        </SpinnerButton>
      </form>

      {readyResumes.length === 0 && !resumesLoading ? (
        <p className={formHintPanel}>
          No processed CV found. Upload and wait for indexing on the CV
          Intelligence page before searching.
        </p>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick?: () => void;
}) {
  if (active) {
    return (
      <span className="inline-flex h-9 items-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white">
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
    >
      <FileText className="h-4 w-4" />
      {label}
    </button>
  );
}
