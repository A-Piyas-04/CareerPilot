"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Input, Select, SpinnerButton } from "@/components/ui";
import type { Resume } from "@/features/resume/types";

import { useSearchJobs } from "./hooks";
import type { JobSourceName } from "./types";

type Props = {
  resumes: Resume[];
  selectedResumeId: string | null;
  onResumeChange: (resumeId: string) => void;
};

export function JobSearchForm({
  resumes,
  selectedResumeId,
  onResumeChange,
}: Props) {
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
      className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-glass)] p-4 shadow-[var(--shadow-soft)] backdrop-blur-xl"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_220px]">
        <Input
          type="text"
          placeholder="e.g. Python backend engineer"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Location, e.g. Berlin"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <Select
          value={source}
          onChange={(e) => setSource(e.target.value as JobSourceName)}
        >
          <option value="jsearch">JSearch marketplace</option>
        </Select>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px]">
        <Select
          value={selectedResumeId ?? ""}
          onChange={(e) => onResumeChange(e.target.value)}
        >
          <option value="" disabled>
            Match against resume...
          </option>
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.file_name} ({r.status})
            </option>
          ))}
        </Select>
        <SpinnerButton
          type="submit"
          variant="emerald"
          loading={search.isPending}
          loadingLabel="Searching..."
          icon={<Search className="h-4 w-4" />}
        >
          Search jobs
        </SpinnerButton>
      </div>
    </form>
  );
}
