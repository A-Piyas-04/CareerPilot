"use client";

import { FileText, PenLine, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { PageShell } from "@/components/layout";
import { EmptyState } from "@/components/ui";
import { alertError, btnPrimary, btnSecondary } from "@/lib/ui-theme";

import { ActiveResumeSelector } from "./components/active-resume-selector";
import { ResumeIntelligenceHeader } from "./components/resume-intelligence-header";
import {
  ResumeModeTabs,
  type CvInputMode,
} from "./components/resume-mode-tabs";
import { ResumeWorkspacePanel } from "./components/resume-workspace-panel";
import { useActivateResume, useResume, useResumes } from "./hooks";
import { ManualResumeEditor } from "./manual-resume-editor";
import { ResumeAnswerBox } from "./resume-answer-box";
import { ResumeBuilderCard } from "./resume-builder-card";
import { ResumeSummary } from "./resume-summary";
import { ResumeUploadCard } from "./resume-upload-card";
import { resumePageStack } from "./resume-ui";
import type { ResumeDetail } from "./types";
import { getPageStatusBadge, pickPrimaryResume } from "./types";

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
  const activateMutation = useActivateResume();
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
  const showEmptyHero = resumes.length === 0 && !resumesQuery.isLoading;

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

  function handleSelectResume(resumeId: string) {
    setSelectedResumeId(resumeId);
    const resume = resumes.find((r) => r.id === resumeId);
    if (
      resume?.status === "processed" &&
      !resume.is_active &&
      !activateMutation.isPending
    ) {
      activateMutation.mutate(resumeId);
    }
  }

  const sectionCount = detailQuery.data?.sections.length;
  const chunkCount = detailQuery.data?.chunk_count;

  const activeResumeBar =
    resumes.length > 0 ? (
      <ActiveResumeSelector
        resumes={resumes}
        effectiveResumeId={effectiveResumeId}
        selectedResume={selectedResume}
        isActivating={activateMutation.isPending}
        onSelect={handleSelectResume}
      />
    ) : (
      <div className="flex items-start gap-4 rounded-2xl border border-dashed border-emerald-300/60 bg-white/85 p-5 shadow-sm ring-1 ring-emerald-900/[0.05] backdrop-blur-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-400">
          <FileText className="h-5 w-5" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-800">
            No active resume
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
            Choose a tab below to upload a file, build step-by-step, or fill in
            the manual editor — your profile unlocks AI features once saved.
          </p>
        </div>
      </div>
    );

  const showOverview = resumes.length > 0 || resumesQuery.isLoading;

  return (
    <PageShell>
      <div className={resumePageStack}>
          <ResumeIntelligenceHeader
            pageBadge={pageBadge}
            hasActiveResume={resumes.length > 0}
            sectionCount={sectionCount}
            chunkCount={chunkCount}
          />

          {resumesQuery.error && (
            <div className={alertError}>{resumesQuery.error.message}</div>
          )}

          {showEmptyHero && (
            <ResumeEmptyState
              onBuild={() => {
                setInputMode("build");
                handleClearBuilderEdit();
              }}
              onManual={() => setInputMode("manual")}
              onUpload={() => setInputMode("upload")}
            />
          )}

          <div ref={inputAreaRef} className="w-full">
            <ResumeWorkspacePanel activeResume={activeResumeBar}>
              <ResumeModeTabs inputMode={inputMode} onChange={setInputMode} />

              {inputMode === "upload" && (
                <ResumeUploadCard
                  embedded
                  onUploadSuccess={handleCvSuccess}
                  uploadDetail={detailQuery.data}
                />
              )}
              {inputMode === "build" && (
                <ResumeBuilderCard
                  embedded
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
                  embedded
                  key={`${effectiveResumeId ?? "new"}-${detailQuery.data?.resume.updated_at ?? "loading"}`}
                  detail={detailQuery.data}
                  onSaveSuccess={handleManualSaveSuccess}
                />
              )}
            </ResumeWorkspacePanel>
          </div>

          <div
            className={`grid w-full gap-6 lg:items-start ${
              showOverview ? "lg:grid-cols-2" : "lg:grid-cols-1"
            }`}
          >
            {showOverview && (
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

            <ResumeAnswerBox
              resumeId={effectiveResumeId ?? undefined}
              resumeStatus={selectedResume?.status}
            />
          </div>
      </div>
    </PageShell>
  );
}
