"use client";

import {
  AlertCircle,
  FileText,
  PenLine,
  Sparkles,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { PageHeader, PageShell } from "@/components/layout";
import { Badge, EmptyState } from "@/components/ui";
import type { BadgeTone } from "@/components/ui";
import { PAGE_RELATED_LINKS } from "@/lib/navigation-config";
import { btnPrimary, btnSecondary } from "@/lib/ui-theme";

import { useResume, useResumes } from "./hooks";
import { ManualResumeEditor } from "./manual-resume-editor";
import { ResumeAnswerBox } from "./resume-answer-box";
import { ResumeBuilderCard } from "./resume-builder-card";
import { ResumeQueryBox } from "./resume-query-box";
import { ResumeSummary } from "./resume-summary";
import { ResumeUploadCard } from "./resume-upload-card";
import { resumeSegmentGroup, resumeSegmentTab } from "./resume-ui";
import type { ResumeDetail } from "./types";
import {
  getPageStatusBadge,
  PAGE_STATUS_LABELS,
  pickPrimaryResume,
} from "./types";

type CvInputMode = "upload" | "build" | "manual";

const BADGE_TONES: Record<ReturnType<typeof getPageStatusBadge>, BadgeTone> = {
  no_cv: "neutral",
  processing: "inProgress",
  failed: "amber",
  rag_ready: "rag",
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
  if (fileType === "builder") return " · built";
  if (fileType === "manual") return " · manual";
  return "";
}

function ResumeEmptyState({
  onUpload,
  onBuild,
  onManual,
}: {
  onUpload: () => void;
  onBuild: () => void;
  onManual: () => void;
}) {
  return (
    <EmptyState
      accent="emerald"
      icon={FileText}
      title="Start your career profile"
      description="Upload an existing resume, build section-by-section, or fill out a structured form. We'll index it for AI answers and job matching."
      actions={
        <>
          <button className={btnPrimary} type="button" onClick={onUpload}>
            <Upload className="h-4 w-4" />
            Upload file
          </button>
          <button className={btnSecondary} type="button" onClick={onBuild}>
            <PenLine className="h-4 w-4" />
            Build from scratch
          </button>
          <button className={btnSecondary} type="button" onClick={onManual}>
            <FileText className="h-4 w-4" />
            Manual editor
          </button>
        </>
      }
    />
  );
}

export function ResumePageClient() {
  const resumesQuery = useResumes();
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<CvInputMode>("upload");
  const [builderEditDetail, setBuilderEditDetail] = useState<ResumeDetail | null>(
    null,
  );
  const [builderEditId, setBuilderEditId] = useState<string | null>(null);
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
    setBuilderEditId(null);
    setBuilderEditDetail(null);
  }

  function handleManualSaveSuccess(resumeId: string) {
    setSelectedResumeId(resumeId);
  }

  function handleRequestReupload() {
    setInputMode("upload");
    inputAreaRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleEditInBuilder(detail: ResumeDetail) {
    setBuilderEditDetail(detail);
    setBuilderEditId(detail.resume.id);
    setInputMode("build");
    inputAreaRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleEditInManual(detail: ResumeDetail) {
    setSelectedResumeId(detail.resume.id);
    setInputMode("manual");
    inputAreaRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleClearBuilderEdit() {
    setBuilderEditDetail(null);
    setBuilderEditId(null);
  }

  const showEmptyHero = resumes.length === 0 && !resumesQuery.isLoading;

  return (
    <PageShell>
      <PageHeader
        accent="emerald"
        eyebrowText="Discover"
        icon={FileText}
        title="CV Intelligence"
        description="Upload, build, or edit your CV, then query it with AI grounded in your real experience."
        relatedLinks={PAGE_RELATED_LINKS["/resume"]}
        actions={
          <Badge
            tone={BADGE_TONES[pageBadge]}
            icon={<BadgeIcon className="h-3.5 w-3.5" />}
          >
            {PAGE_STATUS_LABELS[pageBadge]}
          </Badge>
        }
      />

      <div>
        {resumesQuery.error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {resumesQuery.error.message}
          </p>
        )}

        {resumes.length > 1 && (
          <div className="mb-5">
            <label
              className="text-sm font-medium text-zinc-800"
              htmlFor="resume-select"
            >
              Active resume
            </label>
            <select
              className="mt-1.5 block w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 transition focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
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
            </select>
          </div>
        )}

        {showEmptyHero && (
          <div className="mb-6">
            <ResumeEmptyState
              onBuild={() => {
                setInputMode("build");
                handleClearBuilderEdit();
              }}
              onManual={() => setInputMode("manual")}
              onUpload={() => setInputMode("upload")}
            />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
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
                  Upload
                </button>
                <button
                  className={resumeSegmentTab(inputMode === "build")}
                  role="tab"
                  type="button"
                  aria-selected={inputMode === "build"}
                  onClick={() => setInputMode("build")}
                >
                  <PenLine className="h-4 w-4" />
                  Build CV
                </button>
                <button
                  className={resumeSegmentTab(inputMode === "manual")}
                  role="tab"
                  type="button"
                  aria-selected={inputMode === "manual"}
                  onClick={() => setInputMode("manual")}
                >
                  <FileText className="h-4 w-4" />
                  Manual
                </button>
              </div>

              {inputMode === "upload" && (
                <ResumeUploadCard
                  onUploadSuccess={handleCvSuccess}
                  uploadDetail={detailQuery.data}
                />
              )}
              {inputMode === "build" && (
                <ResumeBuilderCard
                  key={`${builderEditId ?? "new"}-${builderEditDetail?.resume.updated_at ?? "blank"}`}
                  buildDetail={detailQuery.data}
                  editResumeId={builderEditId}
                  initialDetail={builderEditDetail}
                  onBuildSuccess={handleCvSuccess}
                  onClearEdit={handleClearBuilderEdit}
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
                onEditInBuilder={handleEditInBuilder}
                onEditInManual={handleEditInManual}
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
    </PageShell>
  );
}
