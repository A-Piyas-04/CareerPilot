"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { useResume, useResumes } from "./hooks";
import { ResumeQueryBox } from "./resume-query-box";
import { ResumeSummary } from "./resume-summary";
import { ResumeUploadCard } from "./resume-upload-card";
import {
  getPageStatusBadge,
  PAGE_STATUS_LABELS,
  pickPrimaryResume,
} from "./types";

const BADGE_STYLES: Record<
  ReturnType<typeof getPageStatusBadge>,
  string
> = {
  no_cv: "bg-zinc-100 text-zinc-700",
  processing: "bg-amber-100 text-amber-900",
  failed: "bg-red-100 text-red-800",
  rag_ready: "bg-emerald-100 text-emerald-800",
};

export function ResumePageClient() {
  const router = useRouter();
  const resumesQuery = useResumes();
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

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

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  function handleUploadSuccess(resumeId: string) {
    setSelectedResumeId(resumeId);
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              CareerPilot
            </p>
            <h1 className="text-2xl font-semibold text-zinc-950">
              CV Intelligence
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Upload your resume and turn it into searchable career context.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${BADGE_STYLES[pageBadge]}`}
            >
              {PAGE_STATUS_LABELS[pageBadge]}
            </span>
            <button
              className="flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              type="button"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-6">
        {resumesQuery.error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {resumesQuery.error.message}
          </p>
        ) : null}

        {resumes.length > 1 ? (
          <div className="mb-4">
            <label
              className="text-sm font-medium text-zinc-800"
              htmlFor="resume-select"
            >
              Resume
            </label>
            <select
              className="mt-1 block w-full max-w-md rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              id="resume-select"
              value={effectiveResumeId ?? ""}
              onChange={(e) => setSelectedResumeId(e.target.value)}
            >
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.file_name}
                  {resume.is_active ? " (active)" : ""}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <ResumeUploadCard onUploadSuccess={handleUploadSuccess} />
            <ResumeSummary
              detail={detailQuery.data}
              error={detailQuery.error}
              hasResumes={resumes.length > 0}
              isLoading={resumesQuery.isLoading || detailQuery.isLoading}
            />
          </div>

          <ResumeQueryBox
            resumeId={effectiveResumeId ?? undefined}
            resumeStatus={selectedResume?.status}
          />
        </div>
      </div>
    </main>
  );
}
