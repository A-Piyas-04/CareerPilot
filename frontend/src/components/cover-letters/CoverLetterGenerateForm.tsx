"use client";

import { FileText, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

import type {
  CoverLetterTone,
  GenerateCoverLetterRequest,
} from "@/lib/cover-letter/types";

type CoverLetterGenerateFormProps = {
  isGenerating: boolean;
  onGenerate: (payload: GenerateCoverLetterRequest) => void;
};

const TONES: { label: string; value: CoverLetterTone }[] = [
  { label: "Professional", value: "professional" },
  { label: "Concise", value: "concise" },
  { label: "Enthusiastic", value: "enthusiastic" },
];

export function CoverLetterGenerateForm({
  isGenerating,
  onGenerate,
}: CoverLetterGenerateFormProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<CoverLetterTone>("professional");
  const [extraNotes, setExtraNotes] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      isGenerating ||
      !jobTitle.trim() ||
      !companyName.trim() ||
      !jobDescription.trim()
    ) {
      return;
    }

    onGenerate({
      companyName: companyName.trim(),
      extraNotes: extraNotes.trim() || undefined,
      jobDescription: jobDescription.trim(),
      jobTitle: jobTitle.trim(),
      tone,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div>
        <h1 className="text-xl font-semibold text-zinc-950">
          Cover Letter Generator
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Create a tailored letter from a job description and verified CV
          context.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800">Job title</span>
          <input
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            placeholder="ML Engineer Intern"
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
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
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
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
          className="min-h-40 resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
          required
        />
      </label>

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800">Tone</span>
          <select
            value={tone}
            onChange={(event) => setTone(event.target.value as CoverLetterTone)}
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
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
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={
            isGenerating ||
            !jobTitle.trim() ||
            !companyName.trim() ||
            !jobDescription.trim()
          }
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1A56DB] px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          Generate Cover Letter
        </button>
      </div>
    </form>
  );
}
