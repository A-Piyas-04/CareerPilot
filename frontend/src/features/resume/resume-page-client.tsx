"use client";

import {
  AlertCircle,
  FileText,
  LogOut,
  Sparkles,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

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

function resumeTypeLabel(fileType: string | null | undefined): string {
  if (fileType === "builder") return " · built";
  if (fileType === "manual") return " · manual";
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
            <FileText className="h-6 w-6 text-emerald-700" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-zinc-950">
            Start your career profile
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
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
  const router = useRouter();
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

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

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
                  Upload, parse, or edit your CV, then query it with AI grounded
                  in your real experience.
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
                  {resumeTypeLabel(resume.file_type)}
                </option>
              ))}
            </select>
          </div>
        )}

        {showEmptyHero && (
          <div className="mb-6">
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
