"use client";

import { FileText, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SpinnerButton } from "@/components/ui";
import type { Resume } from "@/features/resume/types";

import { useSearchJobs } from "./hooks";

const EXAMPLE_QUERIES = [
  "Python backend engineer",
  "ML internships in Dhaka",
  "Remote data analyst",
];

const RESULT_LIMITS = [10, 20, 25] as const;

type Props = {
  resumes: Resume[];
  selectedResumeId: string | null;
  onResumeChange: (resumeId: string) => void;
  onSearchStart: () => void;
  onSearchSuccess: (result: import("./types").JobSearchResponse) => void;
  onOpenManual: () => void;
};

export function JobSearchForm({
  resumes,
  selectedResumeId,
  onResumeChange,
  onSearchStart,
  onSearchSuccess,
  onOpenManual,
}: Props) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [limit, setLimit] = useState<number>(20);
  const [searchStep, setSearchStep] = useState<"idle" | "fetching" | "scoring">(
    "idle",
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const search = useSearchJobs();

  const readyResumes = resumes.filter((resume) => resume.status === "processed");

  useEffect(() => {
    if (!search.isPending) {
      setSearchStep("idle");
      return;
    }

    setSearchStep("fetching");
    const stepTimer = window.setTimeout(() => setSearchStep("scoring"), 2500);
    const elapsedTimer = window.setInterval(
      () => setElapsedSeconds((value) => value + 1),
      1000,
    );

    return () => {
      window.clearTimeout(stepTimer);
      window.clearInterval(elapsedTimer);
    };
  }, [search.isPending]);

  useEffect(() => {
    if (!search.isPending) {
      setElapsedSeconds(0);
    }
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

    onSearchStart();
    search.mutate(
      {
        query: query.trim(),
        location: location.trim() || undefined,
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
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <TabButton active label="Search jobs" />
        <TabButton active={false} label="Paste a posting" onClick={onOpenManual} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
      >
        <div>
          <label className="text-sm font-medium text-zinc-900">
            What kind of role are you looking for?
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            Describe the role in natural language. You can include location in the
            query or use the optional field below.
          </p>
          <input
            type="text"
            placeholder='e.g. "ML internships in Dhaka open this month"'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuery(example)}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_160px]">
          <input
            type="text"
            placeholder="Optional location (e.g. Berlin)"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
          />
          <select
            value={selectedResumeId ?? ""}
            onChange={(event) => onResumeChange(event.target.value)}
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
          >
            <option value="" disabled>
              Match against CV…
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
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
          >
            {RESULT_LIMITS.map((value) => (
              <option key={value} value={value}>
                {value} results
              </option>
            ))}
          </select>
        </div>

        {search.isPending ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-medium">
              {searchStep === "fetching"
                ? "Step 1/2 — Fetching jobs from JSearch…"
                : "Step 2/2 — Scoring fit against your CV…"}
            </p>
            <p className="mt-1 text-xs text-emerald-800">
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

      {readyResumes.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No processed CV found. Upload and wait for indexing on the CV Intelligence
          page before searching.
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
