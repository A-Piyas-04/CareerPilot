"use client";

import { Sparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { SavedJobSelect } from "@/features/jobs/saved-job-select";
import type { MatchSummary } from "@/features/jobs/types";
import { SpinnerButton } from "@/components/ui";
import { suppressExtensionHydrationProps } from "@/lib/hydration";
import type { GenerateRoadmapRequest } from "@/lib/roadmap/types";
import {
  formHintPanel,
  inputFieldSky,
  surfaceCard,
  textareaFieldSky,
} from "@/lib/ui-theme";

type RoadmapGenerateFormProps = {
  isGenerating: boolean;
  onGenerate: (payload: GenerateRoadmapRequest) => void;
  initialValues?: {
    targetRole?: string;
    jobDescription?: string;
    jobId?: string | null;
  };
  prefillLabel?: string | null;
  savedJobs?: MatchSummary[];
  isLoadingSavedJobs?: boolean;
  savedJobsError?: string | null;
  onSelectSavedJob?: (match: MatchSummary) => void;
  onClearSavedJob?: () => void;
};

const DURATIONS = [4, 8, 12] as const;

export function RoadmapGenerateForm({
  isGenerating,
  onGenerate,
  initialValues,
  prefillLabel,
  savedJobs = [],
  isLoadingSavedJobs = false,
  savedJobsError,
  onSelectSavedJob,
  onClearSavedJob,
}: RoadmapGenerateFormProps) {
  const [targetRole, setTargetRole] = useState(initialValues?.targetRole ?? "");
  const [durationWeeks, setDurationWeeks] =
    useState<GenerateRoadmapRequest["durationWeeks"]>(8);
  const [jobDescription, setJobDescription] = useState(
    initialValues?.jobDescription ?? "",
  );
  const [selectedJobId, setSelectedJobId] = useState(
    initialValues?.jobId ?? "",
  );

  useEffect(() => {
    if (initialValues?.targetRole !== undefined) {
      setTargetRole(initialValues.targetRole);
    }
    if (initialValues?.jobDescription !== undefined) {
      setJobDescription(initialValues.jobDescription);
    }
    if (initialValues?.jobId !== undefined) {
      setSelectedJobId(initialValues.jobId ?? "");
    }
  }, [
    initialValues?.targetRole,
    initialValues?.jobDescription,
    initialValues?.jobId,
  ]);

  function handleSavedJobChange(jobId: string) {
    if (!jobId) {
      setSelectedJobId("");
      onClearSavedJob?.();
      return;
    }

    const match = savedJobs.find((item) => item.job.id === jobId);
    if (!match) {
      return;
    }

    setSelectedJobId(jobId);
    onSelectSavedJob?.(match);
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!targetRole.trim() || isGenerating) {
      return;
    }

    onGenerate({
      durationWeeks,
      jobDescription: jobDescription.trim() || undefined,
      targetRole: targetRole.trim(),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`p-5 ${surfaceCard}`}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-zinc-950">
          Generate a learning plan
        </h2>
        <p className="text-sm text-zinc-600">
          Generate a CV-aware weekly plan for a target role.
        </p>
      </div>

      {prefillLabel ? (
        <p className={`mt-4 ${formHintPanel}`}>
          Loaded job — {prefillLabel}
        </p>
      ) : null}

      <div className="mt-5">
        <SavedJobSelect
          disabled={isGenerating}
          error={savedJobsError}
          isLoading={isLoadingSavedJobs}
          onChange={handleSavedJobChange}
          savedJobs={savedJobs}
          value={selectedJobId}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800">Target role</span>
          <input
            {...suppressExtensionHydrationProps}
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            placeholder="ML Engineer"
            className={inputFieldSky}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800">Duration</span>
          <select
            {...suppressExtensionHydrationProps}
            value={durationWeeks}
            onChange={(event) =>
              setDurationWeeks(Number(event.target.value) as 4 | 8 | 12)
            }
            className={inputFieldSky}
          >
            {DURATIONS.map((duration) => (
              <option key={duration} value={duration}>
                {duration} weeks
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-800">
          Job description
        </span>
        <textarea
          {...suppressExtensionHydrationProps}
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Paste an optional job description to tailor the roadmap."
          className={`min-h-28 ${textareaFieldSky}`}
        />
      </label>

      <div className="mt-5 flex justify-end">
        <SpinnerButton
          type="submit"
          variant="sky"
          loading={isGenerating}
          loadingLabel="Generating…"
          disabled={isGenerating || !targetRole.trim()}
          icon={<Sparkles className="h-4 w-4" />}
        >
          Generate Roadmap
        </SpinnerButton>
      </div>
    </form>
  );
}
