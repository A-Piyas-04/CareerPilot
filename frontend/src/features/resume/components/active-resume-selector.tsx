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
  if (fileType === "builder") return "Built in app";
  if (fileType === "manual") return "Manual entry";
  return "Uploaded file";
}

type ActiveResumeSelectorProps = {
  resumes: Resume[];
  effectiveResumeId: string | null;
  selectedResume?: Resume | null;
  isActivating?: boolean;
  onSelect: (resumeId: string) => void;
};

export function ActiveResumeSelector({
  resumes,
  effectiveResumeId,
  selectedResume,
  isActivating = false,
  onSelect,
}: ActiveResumeSelectorProps) {
  if (resumes.length === 0) return null;

  const isProcessed = selectedResume?.status === "processed";
  const displayName =
    selectedResume?.file_name ?? resumes[0]?.file_name ?? "Untitled resume";

  return (
    <div className={resumeActiveBarPanel}>
      <div className={resumeActiveBarIcon} aria-hidden>
        <FileText className="h-5 w-5 text-white" strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <label className={eyebrow} htmlFor="resume-select">
          Active resume
        </label>

        {resumes.length > 1 ? (
          <div className="relative mt-2.5 max-w-xl">
            <select
              className={`${resumeSelect} appearance-none pr-10 disabled:cursor-wait disabled:opacity-70`}
              disabled={isActivating}
              id="resume-select"
              value={effectiveResumeId ?? ""}
              onChange={(e) => onSelect(e.target.value)}
              aria-label="Choose active resume"
            >
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.file_name}
                  {resume.is_active ? " (active)" : ""}
                  {resume.status !== "processed" ? ` (${resume.status})` : ""}
                </option>
              ))}
            </select>
            {isActivating ? (
              <Loader2
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-700"
                aria-hidden
              />
            ) : (
              <ChevronDown
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700"
                aria-hidden
              />
            )}
          </div>
        ) : (
          <div
            className="mt-2.5 inline-flex max-w-full items-center gap-2.5 rounded-xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50/80 to-white px-3.5 py-2.5 shadow-sm ring-1 ring-emerald-900/[0.04]"
            id="resume-select"
          >
            <p className={`${resumeFileName} truncate text-sm`}>{displayName}</p>
          </div>
        )}

        <p className="mt-1 text-xs font-medium text-emerald-800/80">
          {resumeTypeLabel(selectedResume?.file_type)}
        </p>

        <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-zinc-600">
          <Sparkles
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
            aria-hidden
          />
          <span>
            Powers AI chat, job fit scores, and cover letter generation.
          </span>
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-center">
        {selectedResume?.is_active ? (
          <Badge tone="emerald" icon={<CheckCircle2 className="h-3 w-3" />}>
            Active
          </Badge>
        ) : selectedResume?.status === "processed" ? (
          <Badge tone="sky">Preview</Badge>
        ) : null}
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
