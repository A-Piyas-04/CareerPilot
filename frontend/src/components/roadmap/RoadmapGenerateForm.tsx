"use client";

import { Sparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { SpinnerButton } from "@/components/ui";
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
  };
  prefillLabel?: string | null;
};

const DURATIONS = [4, 8, 12] as const;

export function RoadmapGenerateForm({
  isGenerating,
  onGenerate,
  initialValues,
  prefillLabel,
}: RoadmapGenerateFormProps) {
  const [targetRole, setTargetRole] = useState(initialValues?.targetRole ?? "");
  const [durationWeeks, setDurationWeeks] =
    useState<GenerateRoadmapRequest["durationWeeks"]>(8);
  const [jobDescription, setJobDescription] = useState(
    initialValues?.jobDescription ?? "",
  );

  useEffect(() => {
    if (initialValues?.targetRole) setTargetRole(initialValues.targetRole);
    if (initialValues?.jobDescription) {
      setJobDescription(initialValues.jobDescription);
    }
  }, [initialValues?.targetRole, initialValues?.jobDescription]);

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
          Prefilled from Job Hunter — {prefillLabel}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800">Target role</span>
          <input
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
