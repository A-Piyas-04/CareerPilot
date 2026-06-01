"use client";

import { FileText } from "lucide-react";
import { FormEvent, useState } from "react";

import { Card, Input, Select, SpinnerButton, Textarea } from "@/components/ui";
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
    <Card className="p-5">
      <form onSubmit={handleSubmit}>
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Cover Letter Generator
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Create a tailored letter from a job description and verified CV
            context.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Job title
            </span>
            <Input
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              placeholder="ML Engineer Intern"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Company name
            </span>
            <Input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Acme Corp"
              required
            />
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Job description
          </span>
          <Textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste the role description, requirements, and responsibilities."
            className="min-h-40 resize-y"
            required
          />
        </label>

        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Tone
            </span>
            <Select
              value={tone}
              onChange={(event) => setTone(event.target.value as CoverLetterTone)}
            >
              {TONES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Extra notes
            </span>
            <Input
              value={extraNotes}
              onChange={(event) => setExtraNotes(event.target.value)}
              placeholder="Mention my backend internship"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <SpinnerButton
            type="submit"
            loading={isGenerating}
            loadingLabel="Generating..."
            disabled={
              isGenerating ||
              !jobTitle.trim() ||
              !companyName.trim() ||
              !jobDescription.trim()
            }
            icon={<FileText className="h-4 w-4" />}
          >
            Generate Cover Letter
          </SpinnerButton>
        </div>
      </form>
    </Card>
  );
}
