"use client";

import { FileText } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { SpinnerButton } from "@/components/ui";
import type {
  CoverLetterTone,
  GenerateCoverLetterRequest,
} from "@/lib/cover-letter/types";
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
}: CoverLetterGenerateFormProps) {
  const [jobTitle, setJobTitle] = useState(initialValues?.jobTitle ?? "");
  const [companyName, setCompanyName] = useState(initialValues?.companyName ?? "");
  const [jobDescription, setJobDescription] = useState(
    initialValues?.jobDescription ?? "",
  );
  const [tone, setTone] = useState<CoverLetterTone>("professional");
  const [extraNotes, setExtraNotes] = useState("");
  const [jobId] = useState(initialValues?.jobId ?? "");

  useEffect(() => {
    if (initialValues?.jobTitle) setJobTitle(initialValues.jobTitle);
    if (initialValues?.companyName) setCompanyName(initialValues.companyName);
    if (initialValues?.jobDescription) {
      setJobDescription(initialValues.jobDescription);
    }
  }, [
    initialValues?.jobTitle,
    initialValues?.companyName,
    initialValues?.jobDescription,
  ]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      isGenerating ||
      (!jobId && (!jobTitle.trim() || !companyName.trim() || !jobDescription.trim()))
    ) {
      return;
    }

    onGenerate({
      companyName: companyName.trim(),
      extraNotes: extraNotes.trim() || undefined,
      jobDescription: jobDescription.trim(),
      jobTitle: jobTitle.trim(),
      tone,
      jobId: jobId || undefined,
    });
  };

  return (
    <form
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
          Prefilled from Job Hunter — {prefillLabel}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800">Job title</span>
          <input
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
            (!jobId &&
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
