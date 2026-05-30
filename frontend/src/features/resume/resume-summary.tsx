"use client";

import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Layers,
  Loader2,
  PenLine,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ResumeSummarySkeleton } from "@/components/ui";

import { useDeleteResume } from "./hooks";
import { ResumeDeleteDialog } from "./resume-delete-dialog";
import { ResumeSectionViewerDrawer } from "./resume-section-viewer-drawer";
import { resumeCard, resumeSecondaryButton } from "./resume-ui";
import type { ResumeDetail, ResumeSection, ResumeSkill } from "./types";
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

/* ─── Expandable section card ─────────────────────────────────────────────── */
function SectionCard({
  section,
  onViewFull,
}: {
  section: ResumeDetail["sections"][number];
  onViewFull: (section: ResumeSection) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const preview = section.content.slice(0, 160);
  const hasMore = section.content.length > 160;

  return (
    <li className="rounded-lg border border-zinc-100 bg-zinc-50 transition duration-200 hover:border-zinc-200 hover:bg-white">
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
      {hasMore && (
        <div className="border-t border-zinc-100 px-3 py-2">
          <button
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            type="button"
            onClick={() => onViewFull(section)}
          >
            View full
          </button>
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
  onEditInBuilder?: (detail: ResumeDetail) => void;
  onEditInManual?: (detail: ResumeDetail) => void;
};

export function ResumeSummary({
  detail,
  isLoading,
  error,
  hasResumes,
  onRequestReupload,
  onEditInBuilder,
  onEditInManual,
}: ResumeSummaryProps) {
  const groupedSkills = useMemo(
    () => (detail ? groupSkillsByCategory(detail.skills) : new Map()),
    [detail],
  );

  const deleteMutation = useDeleteResume();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewingSection, setViewingSection] = useState<ResumeSection | null>(
    null,
  );

  function handleDelete() {
    if (!detail?.resume.id) return;
    deleteMutation.mutate(detail.resume.id, {
      onSuccess: () => setDeleteDialogOpen(false),
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

  if (isLoading) return <ResumeSummarySkeleton />;

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
    <section className={resumeCard}>
      {/* Card header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-zinc-950">Resume overview</h2>
          <p className="mt-0.5 truncate text-sm text-zinc-500">
            {resume.file_name}
            {resume.file_type === "builder"
              ? " · built in app"
              : resume.file_type === "manual"
                ? " · manual entry"
                : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

      {isProcessed && onEditInBuilder && resume.file_type === "builder" && (
        <button
          className={`${resumeSecondaryButton} mt-4 w-full sm:w-auto`}
          type="button"
          onClick={() => onEditInBuilder(detail)}
        >
          <PenLine className="h-4 w-4" />
          Edit in builder
        </button>
      )}

      {isProcessed && onEditInManual && resume.file_type === "manual" && (
        <button
          className={`${resumeSecondaryButton} mt-4 w-full sm:w-auto`}
          type="button"
          onClick={() => onEditInManual(detail)}
        >
          <FileText className="h-4 w-4" />
          Edit in manual editor
        </button>
      )}

      {/* Metadata grid */}
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3">
          <dt className="flex items-center gap-1 text-xs text-zinc-500">
            <FileText className="h-3 w-3" />
            Added
          </dt>
          <dd className="mt-1 font-semibold text-zinc-900">
            {formatResumeDate(resume.created_at)}
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3">
          <dt className="flex items-center gap-1 text-xs text-zinc-500">
            <Layers className="h-3 w-3" />
            Sections
          </dt>
          <dd className="mt-1 font-semibold text-zinc-900">{sections.length}</dd>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3">
          <dt className="flex items-center gap-1 text-xs text-zinc-500">
            <Sparkles className="h-3 w-3" />
            Skills
          </dt>
          <dd className="mt-1 font-semibold text-zinc-900">{skills.length}</dd>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3">
          <dt className="flex items-center gap-1 text-xs text-zinc-500">
            <Search className="h-3 w-3" />
            Chunks
          </dt>
          <dd className="mt-1 font-semibold text-zinc-900">{chunk_count}</dd>
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
              <SectionCard
                key={section.id}
                section={section}
                onViewFull={setViewingSection}
              />
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
          <button
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-red-600"
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete this resume
          </button>
        </div>
      )}

      <ResumeSectionViewerDrawer
        isOpen={viewingSection !== null}
        section={viewingSection}
        onClose={() => setViewingSection(null)}
      />

      <ResumeDeleteDialog
        fileName={resume.file_name}
        isOpen={deleteDialogOpen}
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
