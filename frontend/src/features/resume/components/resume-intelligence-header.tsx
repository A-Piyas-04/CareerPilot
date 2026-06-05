"use client";

import { FileText } from "lucide-react";

import { PageHelpButton } from "@/components/layout/page-help-button";

import { resumePageCard } from "../resume-ui";

const RESUME_INTELLIGENCE_DESCRIPTION =
  "Upload, analyze, and ask questions about your resume — every answer is grounded in your actual experience.";

const RESUME_INTELLIGENCE_STEPS = [
  {
    title: "Add your resume",
    description:
      "Upload a file or use the manual editor to create your profile.",
  },
  {
    title: "Wait for processing",
    description:
      "Once indexed, your CV is split into searchable sections and chunks for grounded AI answers.",
  },
  {
    title: "Ask questions and go active",
    description:
      "Set an active resume, then use Q&A here and across Job Hunter, chat, and cover letters.",
  },
];

export function ResumeIntelligenceHeader() {
  return (
    <header
      className={`${resumePageCard} relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6`}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-800"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl"
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-4 pl-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm shadow-emerald-900/20">
              <FileText className="h-4 w-4" aria-hidden />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
              CV Intelligence
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-[1.65rem]">
            Resume Intelligence
          </h1>
        </div>

        <PageHelpButton
          dialogTitle="How Resume Intelligence works"
          ariaLabel="How Resume Intelligence works"
          description={RESUME_INTELLIGENCE_DESCRIPTION}
          steps={RESUME_INTELLIGENCE_STEPS}
        />
      </div>
    </header>
  );
}
