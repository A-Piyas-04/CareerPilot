"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui";
import { eyebrow } from "@/lib/ui-theme";

import {
  resumeActiveBarIcon,
  resumeActiveBarPanel,
  resumeFileName,
  resumeSelect,
} from "../resume-ui";
import type { Resume } from "../types";

function resumeTypeLabel(fileType: string | null | undefined): string {
  if (fileType === "builder") return " · built";
  if (fileType === "manual") return " · manual";
  return "";
}

type ActiveResumeSelectorProps = {
  resumes: Resume[];
  effectiveResumeId: string | null;
  selectedResume?: Resume | null;
  onSelect: (resumeId: string) => void;
};

export function ActiveResumeSelector({
  resumes,
  effectiveResumeId,
  selectedResume,
  onSelect,
}: ActiveResumeSelectorProps) {
  if (resumes.length === 0) return null;

  const isProcessed = selectedResume?.status === "processed";
  const displayName =
    selectedResume?.file_name ?? resumes[0]?.file_name ?? "Untitled resume";

  return (
    <div className={resumeActiveBarPanel}>
      <div className={resumeActiveBarIcon} aria-hidden>
        <FileText className="h-5 w-5" strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <label className={eyebrow} htmlFor="resume-select">
          Active Resume
        </label>

        {resumes.length > 1 ? (
          <div className="relative mt-2 max-w-xl">
            <select
              className={`${resumeSelect} appearance-none pr-10`}
              id="resume-select"
              value={effectiveResumeId ?? ""}
              onChange={(e) => onSelect(e.target.value)}
            >
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.file_name}
                  {resume.is_active ? " (active)" : ""}
                  {resumeTypeLabel(resume.file_type)}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700/70"
              aria-hidden
            />
          </div>
        ) : (
          <div
            className="mt-2 inline-flex max-w-full items-center gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-2 ring-1 ring-emerald-900/[0.05]"
            id="resume-select"
          >
            <FileText
              className="h-4 w-4 shrink-0 text-emerald-700"
              aria-hidden
            />
            <p className={`${resumeFileName} truncate text-sm`}>{displayName}</p>
          </div>
        )}

        <p className="mt-2.5 flex items-start gap-1.5 text-sm leading-relaxed text-zinc-600">
          <Sparkles
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
            aria-hidden
          />
          <span>Used for AI answers, job matching, and cover letters.</span>
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 self-start rounded-xl border border-zinc-200/80 bg-slate-50/90 px-3 py-2.5 sm:self-center">
        {selectedResume?.is_active && (
          <Badge tone="emerald" icon={<CheckCircle2 className="h-3 w-3" />}>
            Active
          </Badge>
        )}
        {isProcessed && (
          <Badge tone="completed" icon={<Sparkles className="h-3 w-3" />}>
            Processed
          </Badge>
        )}
        {selectedResume?.status === "processing" && (
          <Badge
            tone="inProgress"
            icon={<Loader2 className="h-3 w-3 animate-spin" />}
          >
            Processing
          </Badge>
        )}
        {selectedResume?.status === "failed" && (
          <Badge tone="amber" icon={<AlertCircle className="h-3 w-3" />}>
            Failed
          </Badge>
        )}
      </div>
    </div>
  );
}
