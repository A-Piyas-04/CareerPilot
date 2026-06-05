"use client";

import {
  AlertCircle,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  ResumeSummarySkeleton,
  Badge,
  EmptyState,
} from "@/components/ui";
import { alertError, alertWarning, chipAmber, chipEmerald, chipSky } from "@/lib/ui-theme";

import { ExtractedSectionsList } from "./components/extracted-sections-list";
import { ResumeStatsGrid } from "./components/resume-stats-grid";
import { useActivateResume, useDeleteResume } from "./hooks";
import { ResumeDeleteDialog } from "./resume-delete-dialog";
import { ResumeSectionViewerDrawer } from "./resume-section-viewer-drawer";
import {
  resumePageCard,
  resumeCardBody,
  resumeDangerButton,
  resumeFileName,
  resumeSecondaryButton,
} from "./resume-ui";
import type { ResumeDetail, ResumeSkill } from "./types";
import { formatResumeDate } from "./types";

const CATEGORY_CHIPS = [chipEmerald, chipSky, chipAmber] as const;

function skillChipClass(category: string | null | undefined, index: number): string {
  const key = (category ?? "other").toLowerCase();
  const hash = key.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return CATEGORY_CHIPS[(hash + index) % CATEGORY_CHIPS.length];
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

type ResumeSummaryProps = {
  detail: ResumeDetail | undefined;
  isLoading: boolean;
  error: Error | null;
  hasResumes: boolean;
  onRequestReupload?: () => void;
  onEditInManual?: (detail: ResumeDetail) => void;
};

export function ResumeSummary({
  detail,
  isLoading,
  error,
  hasResumes,
  onRequestReupload,
  onEditInManual,
}: ResumeSummaryProps) {
  const groupedSkills = useMemo(
    () => (detail ? groupSkillsByCategory(detail.skills) : new Map()),
    [detail],
  );

  const deleteMutation = useDeleteResume();
  const activateMutation = useActivateResume();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewingSection, setViewingSection] = useState<
    ResumeDetail["sections"][number] | null
  >(null);

  function handleDelete() {
    if (!detail?.resume.id) return;
    deleteMutation.mutate(detail.resume.id, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  }

  if (!hasResumes) {
    return (
      <section className={resumePageCard}>
        <div className={resumeCardBody}>
          <h2 className="text-base font-semibold text-zinc-900">
            Resume overview
          </h2>
          <EmptyState
            accent="emerald"
            icon={FileText}
            title="No resume uploaded yet"
            description="Upload a PDF or DOCX to extract sections, skills, and a searchable index for AI answers."
            variant="dashed"
            className="mt-4 py-8"
          />
        </div>
      </section>
    );
  }

  if (isLoading) return <ResumeSummarySkeleton />;

  if (error) {
    return (
      <section className={resumePageCard}>
        <div className={resumeCardBody}>
          <h2 className="text-base font-semibold text-zinc-900">
            Resume overview
          </h2>
          <div className={`${alertError} mt-4 flex items-start gap-2`}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error.message}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!detail) return null;

  const { resume, sections, skills, chunk_count } = detail;
  const isProcessing =
    resume.status === "processing" || resume.status === "uploaded";
  const isFailed = resume.status === "failed";
  const isProcessed = resume.status === "processed";

  const statusTone = isProcessed
    ? "completed"
    : isFailed
      ? "amber"
      : "inProgress";

  const fileTypeSuffix =
    resume.file_type === "builder"
      ? " · built in app"
      : resume.file_type === "manual"
        ? " · manual entry"
        : "";

  return (
    <section className={resumePageCard}>
      <div className={`${resumeCardBody} space-y-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 border-b border-zinc-200 pb-4">
            <h2 className="text-base font-semibold text-zinc-900">
              Resume overview
            </h2>
            <p className={`${resumeFileName} mt-0.5 truncate text-sm`}>
              {resume.file_name}
              {fileTypeSuffix}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Created {formatResumeDate(resume.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-2 pb-4">
            {resume.is_active && <Badge tone="emerald">Active</Badge>}
            <Badge tone={statusTone} className="capitalize">
              {resume.status}
            </Badge>
          </div>
        </div>

        {isProcessed && !resume.is_active && (
          <button
            className={`${resumeSecondaryButton} w-full sm:w-auto`}
            disabled={activateMutation.isPending}
            type="button"
            onClick={() => activateMutation.mutate(resume.id)}
          >
            {activateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Use for AI features
          </button>
        )}

        {isProcessed && onEditInManual && resume.file_type === "manual" && (
          <button
            className={`${resumeSecondaryButton} w-full sm:w-auto`}
            type="button"
            onClick={() => onEditInManual(detail)}
          >
            <FileText className="h-4 w-4" />
            Edit in manual editor
          </button>
        )}

        <ResumeStatsGrid
          createdAt={resume.created_at}
          sectionCount={sections.length}
          skillCount={skills.length}
          chunkCount={chunk_count}
        />

        {sections.length === 0 && chunk_count === 0 && !isProcessing && (
          <p className="text-sm text-zinc-500">
            No searchable chunks yet. Re-upload or wait for processing to finish.
          </p>
        )}

        {isProcessing && (
          <div className={`${alertWarning} flex items-center gap-2`}>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            Processing resume… this may take a few seconds.
          </div>
        )}

        {isFailed && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-2 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{resume.error_message ?? "Resume processing failed."}</p>
            </div>
            {onRequestReupload && (
              <button
                className="mt-3 flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                type="button"
                onClick={onRequestReupload}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Upload a new file
              </button>
            )}
          </div>
        )}

        <ExtractedSectionsList
          sections={sections}
          onViewFull={setViewingSection}
        />

        {skills.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Extracted skills
              <span className="ml-2 font-normal text-zinc-500">
                ({skills.length})
              </span>
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
                    {categorySkills.map((skill: ResumeSkill, skillIndex: number) => (
                      <span
                        className={skillChipClass(skill.category, skillIndex)}
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
        ) : (
          !isProcessing && (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-5 text-center">
              <Sparkles className="mx-auto h-5 w-5 text-zinc-400" />
              <p className="mt-2 text-sm font-medium text-zinc-700">
                No skills extracted
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Skills appear after processing or when added in the manual editor.
              </p>
            </div>
          )
        )}

        {isProcessed && (
          <div className="rounded-lg border border-red-100 bg-red-50/40 px-4 py-3">
            <p className="text-sm font-medium text-zinc-800">Delete this resume</p>
            <p className="mt-0.5 text-xs text-zinc-600">
              Permanently removes sections, skills, and search chunks. This cannot
              be undone.
            </p>
            <button
              className={`${resumeDangerButton} mt-3`}
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete resume
            </button>
          </div>
        )}
      </div>

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
