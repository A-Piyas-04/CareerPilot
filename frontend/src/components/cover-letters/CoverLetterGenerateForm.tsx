"use client";

import { FileText } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { SavedJobSelect } from "@/features/jobs/saved-job-select";
import type { MatchSummary } from "@/features/jobs/types";
import { SpinnerButton } from "@/components/ui";
import type {
  CoverLetterTone,
  GenerateCoverLetterRequest,
} from "@/lib/cover-letter/types";
import { suppressExtensionHydrationProps } from "@/lib/hydration";
import {
  formHintPanel,
  inputFieldSky,
  surfaceCard,
  textareaFieldSky,
} from "@/lib/ui-theme";

type CoverLetterGenerateFormProps = {
  isGenerating: boolean;
  onGenerate: (payload: GenerateCoverLetterRequest) => void;
  initialValues?: {
    jobTitle?: string;
    companyName?: string;
    jobDescription?: string;
    jobId?: string;
  };
  prefillLabel?: string | null;
  savedJobs?: MatchSummary[];
  isLoadingSavedJobs?: boolean;
  savedJobsError?: string | null;
  onSelectSavedJob?: (match: MatchSummary) => void;
  onClearSavedJob?: () => void;
};

const TONES: { label: string; value: CoverLetterTone }[] = [
  { label: "Professional", value: "professional" },
  { label: "Concise", value: "concise" },
  { label: "Enthusiastic", value: "enthusiastic" },
];

export function CoverLetterGenerateForm({
  isGenerating,
  onGenerate,
  initialValues,
  prefillLabel,
  savedJobs = [],
  isLoadingSavedJobs = false,
  savedJobsError,
  onSelectSavedJob,
  onClearSavedJob,
}: CoverLetterGenerateFormProps) {
  const [jobTitle, setJobTitle] = useState(initialValues?.jobTitle ?? "");
  const [companyName, setCompanyName] = useState(initialValues?.companyName ?? "");
  const [jobDescription, setJobDescription] = useState(
    initialValues?.jobDescription ?? "",
  );
  const [tone, setTone] = useState<CoverLetterTone>("professional");
  const [extraNotes, setExtraNotes] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(initialValues?.jobId ?? "");

  useEffect(() => {
    if (initialValues?.jobTitle !== undefined) {
      setJobTitle(initialValues.jobTitle);
    }
    if (initialValues?.companyName !== undefined) {
      setCompanyName(initialValues.companyName);
    }
    if (initialValues?.jobDescription !== undefined) {
      setJobDescription(initialValues.jobDescription);
    }
    if (initialValues?.jobId !== undefined) {
      setSelectedJobId(initialValues.jobId ?? "");
    }
  }, [
    initialValues?.jobTitle,
    initialValues?.companyName,
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

    if (
      isGenerating ||
      (!selectedJobId &&
        (!jobTitle.trim() || !companyName.trim() || !jobDescription.trim()))
    ) {
      return;
    }

    onGenerate({
      companyName: companyName.trim(),
      extraNotes: extraNotes.trim() || undefined,
      jobDescription: jobDescription.trim(),
      jobTitle: jobTitle.trim(),
      tone,
      jobId: selectedJobId || undefined,
    });
  };

  return (
    <form
      {...suppressExtensionHydrationProps}
      onSubmit={handleSubmit}
      className={`p-5 ${surfaceCard}`}
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">
          Generate a cover letter
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Create a tailored letter from a job description and verified CV
          context.
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

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800">Job title</span>
          <input
            {...suppressExtensionHydrationProps}
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            placeholder="ML Engineer Intern"
            className={inputFieldSky}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800">
            Company name
          </span>
          <input
            {...suppressExtensionHydrationProps}
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Acme Corp"
            className={inputFieldSky}
            required
          />
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
          placeholder="Paste the role description, requirements, and responsibilities."
          className={`min-h-40 ${textareaFieldSky}`}
          required
        />
      </label>

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800">Tone</span>
          <select
            {...suppressExtensionHydrationProps}
            value={tone}
            onChange={(event) => setTone(event.target.value as CoverLetterTone)}
            className={inputFieldSky}
          >
            {TONES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800">
            Extra notes
          </span>
          <input
            {...suppressExtensionHydrationProps}
            value={extraNotes}
            onChange={(event) => setExtraNotes(event.target.value)}
            placeholder="Mention my backend internship"
            className={inputFieldSky}
          />
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <SpinnerButton
          type="submit"
          variant="sky"
          loading={isGenerating}
          loadingLabel="Generating…"
          disabled={
            isGenerating ||
            (!selectedJobId &&
              (!jobTitle.trim() ||
                !companyName.trim() ||
                !jobDescription.trim()))
          }
          icon={<FileText className="h-4 w-4" />}
        >
          Generate Cover Letter
        </SpinnerButton>
      </div>
    </form>
  );
}
