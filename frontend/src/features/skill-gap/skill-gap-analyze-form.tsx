"use client";

import { LineChart } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import type { MatchSummary } from "@/features/jobs/types";
import { SavedJobSelect } from "@/features/jobs/saved-job-select";
import { SpinnerButton } from "@/components/ui";
import { suppressExtensionHydrationProps } from "@/lib/hydration";
import {
  formHintPanel,
  inputFieldSky,
  surfaceCard,
  textareaFieldSky,
} from "@/lib/ui-theme";

export type SkillGapFormValues = {
  targetRole: string;
  jobDescription: string;
  jobId?: string | null;
  resumeId?: string | null;
};

type Props = {
  initialValues?: Partial<SkillGapFormValues>;
  previewMissingSkills?: string[];
  prefillLabel?: string | null;
  savedJobs?: MatchSummary[];
  isLoadingSavedJobs?: boolean;
  savedJobsError?: string | null;
  onSelectSavedJob?: (match: MatchSummary) => void;
  onClearSavedJob?: () => void;
  isAnalyzing: boolean;
  onAnalyze: (values: SkillGapFormValues) => void;
};

export function SkillGapAnalyzeForm({
  initialValues,
  previewMissingSkills = [],
  prefillLabel,
  savedJobs = [],
  isLoadingSavedJobs = false,
  savedJobsError,
  onSelectSavedJob,
  onClearSavedJob,
  isAnalyzing,
  onAnalyze,
}: Props) {
  const [targetRole, setTargetRole] = useState(initialValues?.targetRole ?? "");
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!targetRole.trim() || isAnalyzing) return;

    onAnalyze({
      targetRole: targetRole.trim(),
      jobDescription: jobDescription.trim(),
      jobId: selectedJobId || initialValues?.jobId || null,
      resumeId: initialValues?.resumeId,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`p-5 ${surfaceCard}`}
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">Analyze a role</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Compare your CV against a target role and get prioritized learning
          recommendations grounded in your experience.
        </p>
      </div>

      {prefillLabel ? (
        <p className={`mt-4 ${formHintPanel}`}>
          Loaded job — {prefillLabel}
        </p>
      ) : null}

      <div className="mt-5">
        <SavedJobSelect
          disabled={isAnalyzing}
          error={savedJobsError}
          isLoading={isLoadingSavedJobs}
          onChange={handleSavedJobChange}
          savedJobs={savedJobs}
          value={selectedJobId}
        />
      </div>

      {previewMissingSkills.length > 0 ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Deterministic gaps from fit score
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {previewMissingSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-amber-900"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800">Target role</span>
          <input
            {...suppressExtensionHydrationProps}
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            placeholder="ML Engineer Intern"
            className={inputFieldSky}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800">
            Job description (optional)
          </span>
          <textarea
            {...suppressExtensionHydrationProps}
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste a job description for more precise gap analysis…"
            className={`min-h-40 ${textareaFieldSky}`}
          />
        </label>
      </div>

      <SpinnerButton
        type="submit"
        variant="sky"
        loading={isAnalyzing}
        loadingLabel="Analyzing…"
        disabled={isAnalyzing || !targetRole.trim()}
        icon={<LineChart className="h-4 w-4" />}
        className="mt-5 h-10 px-4"
      >
        Run skill gap analysis
      </SpinnerButton>
    </form>
  );
}
