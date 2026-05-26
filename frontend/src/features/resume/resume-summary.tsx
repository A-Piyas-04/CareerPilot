"use client";

import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useDeleteResume } from "./hooks";
import type { ResumeDetail, ResumeSkill } from "./types";
import { formatResumeDate } from "./types";

/* ─── Category color map ──────────────────────────────────────────────────── */
const CATEGORY_COLORS: Record<string, string> = {
  language:  "bg-blue-50   border-blue-100  text-blue-900",
  framework: "bg-violet-50 border-violet-100 text-violet-900",
  database:  "bg-orange-50 border-orange-100 text-orange-900",
  devops:    "bg-slate-50  border-slate-200  text-slate-800",
  cloud:     "bg-sky-50    border-sky-100    text-sky-900",
  "ml/ai":   "bg-pink-50   border-pink-100   text-pink-900",
  other:     "bg-zinc-50   border-zinc-200   text-zinc-700",
};

function skillColor(category: string | null | undefined): string {
  return CATEGORY_COLORS[(category ?? "other").toLowerCase()] ?? CATEGORY_COLORS.other;
}

function groupSkillsByCategory(
  skills: ResumeDetail["skills"],
): Map<string, ResumeDetail["skills"]> {
  const map = new Map<string, ResumeDetail["skills"]>();
  for (const skill of skills) {
    const key = skill.category?.trim().toLowerCase() || "other";
    map.set(key, [...(map.get(key) ?? []), skill]);
  }
  return map;
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function ResumeSkeleton() {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm animate-pulse">
      <div className="h-5 w-36 rounded bg-zinc-200" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="h-3 w-16 rounded bg-zinc-100" />
            <div className="mt-1 h-4 w-32 rounded bg-zinc-200" />
          </div>
        ))}
      </div>
      <div className="mt-6 h-4 w-32 rounded bg-zinc-200" />
      <div className="mt-3 space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-zinc-100" />
        ))}
      </div>
    </section>
  );
}

/* ─── Expandable section card ─────────────────────────────────────────────── */
function SectionCard({ section }: { section: ResumeDetail["sections"][number] }) {
  const [expanded, setExpanded] = useState(false);
  const preview = section.content.slice(0, 160);
  const hasMore = section.content.length > 160;

  return (
    <li className="rounded-lg border border-zinc-100 bg-zinc-50">
      <button
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block rounded-md bg-white border border-zinc-200 px-2 py-0.5 text-xs font-semibold capitalize text-zinc-800 shrink-0">
            {section.section_name}
          </span>
          <span className="truncate text-xs text-zinc-500">
            {!expanded && preview}
            {!expanded && hasMore && "…"}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-400">
            {section.content.length} chars
          </span>
          {hasMore &&
            (expanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            ))}
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3">
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-600">
            {section.content}
          </p>
        </div>
      )}
    </li>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
type ResumeSummaryProps = {
  detail: ResumeDetail | undefined;
  isLoading: boolean;
  error: Error | null;
  hasResumes: boolean;
  onRequestReupload?: () => void;
};

export function ResumeSummary({
  detail,
  isLoading,
  error,
  hasResumes,
  onRequestReupload,
}: ResumeSummaryProps) {
  const groupedSkills = useMemo(
    () => (detail ? groupSkillsByCategory(detail.skills) : new Map()),
    [detail],
  );

  const deleteMutation = useDeleteResume();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleDelete() {
    if (!detail?.resume.id) return;
    deleteMutation.mutate(detail.resume.id, {
      onSuccess: () => setConfirmingDelete(false),
    });
  }

  /* ── Empty state ── */
  if (!hasResumes) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-950">Resume overview</h2>
        <div className="mt-6 flex flex-col items-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
            <FileText className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="mt-3 text-sm font-semibold text-zinc-800">
            No resume uploaded yet
          </p>
          <p className="mt-1 max-w-xs text-sm text-zinc-500">
            Upload a PDF or DOCX to extract sections, skills, and a RAG-ready
            search index.
          </p>
        </div>
      </section>
    );
  }

  if (isLoading) return <ResumeSkeleton />;

  if (error) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-950">Resume overview</h2>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error.message}</p>
        </div>
      </section>
    );
  }

  if (!detail) return null;

  const { resume, sections, skills, chunk_count } = detail;
  const isProcessing = resume.status === "processing" || resume.status === "uploaded";
  const isFailed = resume.status === "failed";
  const isProcessed = resume.status === "processed";

  const statusBadge = isProcessed
    ? "bg-emerald-100 text-emerald-800"
    : isFailed
      ? "bg-red-100 text-red-800"
      : "bg-amber-100 text-amber-900";

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      {/* Card header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-zinc-950">Resume overview</h2>
          <p className="mt-0.5 truncate text-sm text-zinc-500">{resume.file_name}</p>
        </div>
        <div className="flex items-center gap-2">
          {resume.is_active && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Active
            </span>
          )}
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge}`}>
            {resume.status}
          </span>
        </div>
      </div>

      {/* Metadata grid */}
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-zinc-500">Uploaded</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">
            {formatResumeDate(resume.created_at)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Sections</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{sections.length}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Skills found</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{skills.length}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Search chunks</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{chunk_count}</dd>
        </div>
      </dl>

      {/* Processing banner */}
      {isProcessing && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          Processing your CV — this may take a few seconds…
        </div>
      )}

      {/* Failure banner + retry */}
      {isFailed && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-3">
          <div className="flex items-start gap-2 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{resume.error_message ?? "Resume processing failed."}</p>
          </div>
          {onRequestReupload && (
            <button
              className="mt-2 flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
              type="button"
              onClick={onRequestReupload}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Upload a new file
            </button>
          )}
        </div>
      )}

      {/* Sections */}
      {sections.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Extracted sections
            <span className="ml-2 normal-case font-normal">({sections.length})</span>
          </h3>
          <ul className="mt-2 space-y-1.5">
            {sections.map((section) => (
              <SectionCard key={section.id} section={section} />
            ))}
          </ul>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Extracted skills
            <span className="ml-2 normal-case font-normal">({skills.length})</span>
          </h3>
          <div className="mt-3 space-y-3">
            {[...groupedSkills.entries()].map(([category, categorySkills]) => (
              <div key={category}>
                {groupedSkills.size > 1 && (
                  <p className="mb-1.5 text-xs font-semibold capitalize text-zinc-500">
                    {category}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {categorySkills.map((skill: ResumeSkill) => (
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${skillColor(skill.category)}`}
                      key={skill.id}
                      title={skill.evidence ?? undefined}
                    >
                      {skill.skill_name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete */}
      {isProcessed && (
        <div className="mt-6 border-t border-zinc-100 pt-4">
          {confirmingDelete ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-zinc-600">Delete this resume?</p>
              <button
                className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                type="button"
                disabled={deleteMutation.isPending}
                onClick={handleDelete}
              >
                {deleteMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Yes, delete
              </button>
              <button
                className="rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100"
                type="button"
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-red-600"
              type="button"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete this resume
            </button>
          )}
        </div>
      )}
    </section>
  );
}
