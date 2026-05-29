"use client";

import {
  AlertCircle,
  FileText,
  LogOut,
  PenLine,
  Sparkles,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { useResume, useResumes } from "./hooks";
import { ResumeAnswerBox } from "./resume-answer-box";
import { ResumeBuilderCard } from "./resume-builder-card";
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
import type { ResumeDetail } from "./types";
import {
  getPageStatusBadge,
  PAGE_STATUS_LABELS,
  pickPrimaryResume,
} from "./types";

type CvInputMode = "upload" | "build";

const BADGE_STYLES: Record<
  ReturnType<typeof getPageStatusBadge>,
  string
> = {
  no_cv: "bg-zinc-100 text-zinc-600",
  processing: "bg-amber-100 text-amber-900",
  failed: "bg-red-100 text-red-800",
  rag_ready: "bg-emerald-100 text-emerald-800",
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

function ResumeEmptyState({
  onUpload,
  onBuild,
}: {
  onUpload: () => void;
  onBuild: () => void;
}) {
  return (
    <section className={`${resumeCard} text-center`}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-indigo-100">
        <FileText className="h-7 w-7 text-emerald-700" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-zinc-950">
        Start your career profile
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
        Upload an existing resume or build one in minutes. We&apos;ll index it
        for AI answers, job matching, and your assistant.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button className={resumePrimaryButton} type="button" onClick={onUpload}>
          <Upload className="h-4 w-4" />
          Upload file
        </button>
        <button className={resumeSecondaryButton} type="button" onClick={onBuild}>
          <PenLine className="h-4 w-4" />
          Build from scratch
        </button>
      </div>
    </section>
  );
}

export function ResumePageClient() {
  const router = useRouter();
  const resumesQuery = useResumes();
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<CvInputMode>("upload");
  const [builderEditDetail, setBuilderEditDetail] = useState<ResumeDetail | null>(
    null,
  );
  const [builderEditId, setBuilderEditId] = useState<string | null>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);

  const resumes = resumesQuery.data ?? [];
  const primaryResume = useMemo(() => pickPrimaryResume(resumes), [resumes]);

  useEffect(() => {
    if (primaryResume && !selectedResumeId) {
      setSelectedResumeId(primaryResume.id);
    }
  }, [primaryResume, selectedResumeId]);

  const effectiveResumeId = selectedResumeId ?? primaryResume?.id ?? null;
  const detailQuery = useResume(effectiveResumeId ?? undefined);

  const selectedResume =
    detailQuery.data?.resume ??
    resumes.find((r) => r.id === effectiveResumeId) ??
    primaryResume;

  const pageBadge = getPageStatusBadge(resumes, selectedResume);
  const BadgeIcon = BADGE_ICONS[pageBadge];

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  function handleCvSuccess(resumeId: string) {
    setSelectedResumeId(resumeId);
    setBuilderEditId(null);
    setBuilderEditDetail(null);
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

  function handleClearBuilderEdit() {
    setBuilderEditDetail(null);
    setBuilderEditId(null);
  }

  const showEmptyHero = resumes.length === 0 && !resumesQuery.isLoading;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f6f7f9] to-zinc-100/80">
      <header className="border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-950">
                  CV Intelligence
                </h1>
                <p className="mt-0.5 max-w-lg text-sm text-zinc-500">
                  Upload or build your CV, then query it with AI grounded in your
                  real experience.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${BADGE_STYLES[pageBadge]}`}
              >
                <BadgeIcon className="h-3.5 w-3.5" />
                {PAGE_STATUS_LABELS[pageBadge]}
              </span>
              <button
                className="flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-600 transition duration-200 hover:bg-zinc-50 hover:text-zinc-900"
                type="button"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-6">
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
                  {resume.file_type === "builder" ? " · built" : ""}
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
              </div>

              {inputMode === "upload" ? (
                <ResumeUploadCard
                  onUploadSuccess={handleCvSuccess}
                  uploadDetail={detailQuery.data}
                />
              ) : (
                <ResumeBuilderCard
                  buildDetail={detailQuery.data}
                  editResumeId={builderEditId}
                  initialDetail={builderEditDetail}
                  onBuildSuccess={handleCvSuccess}
                  onClearEdit={handleClearBuilderEdit}
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
