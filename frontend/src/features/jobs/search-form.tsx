"use client";

import { Search } from "lucide-react";

import { SpinnerButton } from "@/components/ui";
import { useState } from "react";
import { toast } from "sonner";

import type { Resume } from "@/features/resume/types";

import { useSearchJobs } from "./hooks";
import type { JobSourceName } from "./types";

type Props = {
  resumes: Resume[];
  selectedResumeId: string | null;
  onResumeChange: (resumeId: string) => void;
};

export function JobSearchForm({ resumes, selectedResumeId, onResumeChange }: Props) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState<JobSourceName>("jsearch");
  const search = useSearchJobs();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedResumeId) {
      toast.error("Pick a resume to match against first.");
      return;
    }
    if (!query.trim()) {
      toast.error("Enter a search query.");
      return;
    }
    search.mutate(
      {
        query: query.trim(),
        location: location.trim() || undefined,
        source,
        resume_id: selectedResumeId,
        limit: 10,
      },
      {
        onSuccess: (result) => {
          toast.success(`Found ${result.matches.length} matches.`);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_180px]">
        <input
          type="text"
          placeholder="e.g. Python backend engineer"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Location (optional, e.g. Berlin)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as JobSourceName)}
          className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
        >
          <option value="jsearch">JSearch (LinkedIn/Indeed)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
        <select
          value={selectedResumeId ?? ""}
          onChange={(e) => onResumeChange(e.target.value)}
          className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
        >
          <option value="" disabled>
            Match against resume…
          </option>
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.file_name} ({r.status})
            </option>
          ))}
        </select>
        <SpinnerButton
          type="submit"
          variant="emerald"
          loading={search.isPending}
          loadingLabel="Searching…"
          icon={<Search className="h-4 w-4" />}
        >
          Search jobs
        </SpinnerButton>
      </div>
    </form>
  );
}
