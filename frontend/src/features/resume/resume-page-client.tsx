"use client";

import {
  AlertCircle,
  FileText,
  Sparkles,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Badge, PageHeader, Select } from "@/components/ui";

import { useResume, useResumes } from "./hooks";
import { ManualResumeEditor } from "./manual-resume-editor";
import { ResumeAnswerBox } from "./resume-answer-box";
import { ResumeQueryBox } from "./resume-query-box";
import { ResumeSummary } from "./resume-summary";
import { ResumeUploadCard } from "./resume-upload-card";
import {
  resumeCard,
  resumePrimaryButton,
  resumeSecondaryButton,
  resumeSegmentGroup,
  resumeSegmentTab,
} from "./resume-ui";
import {
  getPageStatusBadge,
  PAGE_STATUS_LABELS,
  pickPrimaryResume,
} from "./types";
import type { ResumeDetail } from "./types";

type CvInputMode = "upload" | "manual";

const BADGE_STYLES: Record<
  ReturnType<typeof getPageStatusBadge>,
  string
> = {
  no_cv: "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--muted-foreground)]",
  processing: "border-transparent bg-[var(--warning-soft)] text-[var(--warning)]",
  failed: "border-transparent bg-[var(--danger-soft)] text-[var(--danger)]",
  rag_ready: "border-transparent bg-[var(--success-soft)] text-[var(--success)]",
};

const BADGE_ICONS: Record<
  ReturnType<typeof getPageStatusBadge>,
  typeof FileText
> = {
  no_cv: FileText,
  processing: Sparkles,
  failed: AlertCircle,
  rag_ready: Sparkles,
};

function resumeTypeLabel(fileType: string | null | undefined): string {
  if (fileType === "builder") return " - built";
  if (fileType === "manual") return " - manual";
  return "";
}

function ResumeEmptyState({
  onUpload,
  onManual,
}: {
  onUpload: () => void;
  onManual: () => void;
}) {
  return (
    <section className={resumeCard}>
      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
            <FileText className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
            Start your career profile
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
            Upload a resume for AI-assisted parsing, or enter your CV details
            manually in a structured editor. Both paths create searchable
            sections, skills, and chunks.
          </p>
        </div>
        <div className="grid gap-2">
          <button
            className={`${resumePrimaryButton} justify-start px-4`}
            type="button"
            onClick={onUpload}
          >
            <Upload className="h-4 w-4" />
            Upload and parse CV
          </button>
          <button
            className={`${resumeSecondaryButton} justify-start px-4`}
            type="button"
            onClick={onManual}
          >
            <FileText className="h-4 w-4" />
            Create manually
          </button>
        </div>
      </div>
    </section>
  );
}

export function ResumePageClient() {
  const resumesQuery = useResumes();
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<CvInputMode>("upload");
  const inputAreaRef = useRef<HTMLDivElement>(null);

  const resumes = useMemo(() => resumesQuery.data ?? [], [resumesQuery.data]);
  const primaryResume = useMemo(() => pickPrimaryResume(resumes), [resumes]);

  const effectiveResumeId = selectedResumeId ?? primaryResume?.id ?? null;
  const detailQuery = useResume(effectiveResumeId ?? undefined);

  const selectedResume =
    detailQuery.data?.resume ??
    resumes.find((r) => r.id === effectiveResumeId) ??
    primaryResume;

  const pageBadge = getPageStatusBadge(resumes, selectedResume);
  const BadgeIcon = BADGE_ICONS[pageBadge];

  function handleCvSuccess(resumeId: string) {
    setSelectedResumeId(resumeId);
    setInputMode("manual");
  }

  function handleManualSaveSuccess(resumeId: string) {
    setSelectedResumeId(resumeId);
  }

  function handleRequestReupload() {
    setInputMode("upload");
    inputAreaRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleEditInManual(detail: ResumeDetail) {
    setSelectedResumeId(detail.resume.id);
    setInputMode("manual");
    inputAreaRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const showEmptyHero = resumes.length === 0 && !resumesQuery.isLoading;

  return (
    <main className="cp-page">
      <div className="cp-container max-w-6xl py-6">
        <PageHeader
          eyebrow="Profile engine"
          icon={FileText}
          title="CV Intelligence"
          description="Upload, parse, or edit your CV, then query it with AI grounded in your real experience."
          actions={
            <Badge className={BADGE_STYLES[pageBadge]}>
              <BadgeIcon className="h-3.5 w-3.5" />
              {PAGE_STATUS_LABELS[pageBadge]}
            </Badge>
          }
        />

        {resumesQuery.error && (
          <p className="mt-5 rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2.5 text-sm text-[var(--danger)]">
            {resumesQuery.error.message}
          </p>
        )}

        {resumes.length > 1 && (
          <div className="mt-6 mb-5">
            <label
              className="text-sm font-medium text-[var(--foreground)]"
              htmlFor="resume-select"
            >
              Active resume
            </label>
            <Select
              className="mt-1.5 max-w-md"
              id="resume-select"
              value={effectiveResumeId ?? ""}
              onChange={(e) => setSelectedResumeId(e.target.value)}
            >
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.file_name}
                  {resume.is_active ? " (active)" : ""}
                  {resumeTypeLabel(resume.file_type)}
                </option>
              ))}
            </Select>
          </div>
        )}

        {showEmptyHero && (
          <div className="mt-6 mb-6">
            <ResumeEmptyState
              onManual={() => setInputMode("manual")}
              onUpload={() => setInputMode("upload")}
            />
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <div className="space-y-6">
            <div ref={inputAreaRef}>
              <div
                className={`${resumeSegmentGroup} mb-4`}
                role="tablist"
                aria-label="CV input method"
              >
                <button
                  className={resumeSegmentTab(inputMode === "upload")}
                  role="tab"
                  type="button"
                  aria-selected={inputMode === "upload"}
                  onClick={() => setInputMode("upload")}
                >
                  <Upload className="h-4 w-4" />
                  Upload & Parse
                </button>
                <button
                  className={resumeSegmentTab(inputMode === "manual")}
                  role="tab"
                  type="button"
                  aria-selected={inputMode === "manual"}
                  onClick={() => setInputMode("manual")}
                >
                  <FileText className="h-4 w-4" />
                  Manual Editor
                </button>
              </div>

              {inputMode === "upload" && (
                <ResumeUploadCard
                  onUploadSuccess={handleCvSuccess}
                  uploadDetail={detailQuery.data}
                />
              )}
              {inputMode === "manual" && (
                <ManualResumeEditor
                  key={`${effectiveResumeId ?? "new"}-${detailQuery.data?.resume.updated_at ?? "loading"}`}
                  detail={detailQuery.data}
                  onSaveSuccess={handleManualSaveSuccess}
                />
              )}
            </div>

            {(resumes.length > 0 || resumesQuery.isLoading) && (
              <ResumeSummary
                detail={detailQuery.data}
                error={detailQuery.error}
                hasResumes={resumes.length > 0}
                isLoading={resumesQuery.isLoading || detailQuery.isLoading}
                onEditInManual={() => {
                  if (detailQuery.data) handleEditInManual(detailQuery.data);
                }}
                onRequestReupload={handleRequestReupload}
              />
            )}
          </div>

          <ResumeAnswerBox
            resumeId={effectiveResumeId ?? undefined}
            resumeStatus={selectedResume?.status}
          />
        </div>

        {resumes.length > 0 && (
          <div className="mt-6">
            <ResumeQueryBox
              resumeId={effectiveResumeId ?? undefined}
              resumeStatus={selectedResume?.status}
            />
          </div>
        )}
      </div>
    </main>
  );
}
