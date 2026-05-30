"use client";

import { LineChart } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { SpinnerButton } from "@/components/ui";
import { surfaceCard } from "@/lib/ui-theme";

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
  isAnalyzing: boolean;
  onAnalyze: (values: SkillGapFormValues) => void;
};

export function SkillGapAnalyzeForm({
  initialValues,
  previewMissingSkills = [],
  prefillLabel,
  isAnalyzing,
  onAnalyze,
}: Props) {
  const [targetRole, setTargetRole] = useState(initialValues?.targetRole ?? "");
  const [jobDescription, setJobDescription] = useState(
    initialValues?.jobDescription ?? "",
  );

  useEffect(() => {
    if (initialValues?.targetRole) {
      setTargetRole(initialValues.targetRole);
    }
    if (initialValues?.jobDescription) {
      setJobDescription(initialValues.jobDescription);
    }
  }, [initialValues?.targetRole, initialValues?.jobDescription]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!targetRole.trim() || isAnalyzing) return;

    onAnalyze({
      targetRole: targetRole.trim(),
      jobDescription: jobDescription.trim(),
      jobId: initialValues?.jobId,
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
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Prefilled from Job Hunter — {prefillLabel}
        </p>
      ) : null}

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
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            placeholder="ML Engineer Intern"
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800">
            Job description (optional)
          </span>
          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste a job description for more precise gap analysis…"
            className="min-h-40 w-full resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
      </div>

      <SpinnerButton
        type="submit"
        variant="emerald"
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
