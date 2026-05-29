"use client";

import { Loader2, PenLine, Plus, Save, Trash2 } from "lucide-react";
import { useId, useState } from "react";

import { useBuildResume, useRebuildResume } from "./hooks";
import {
  ResumeUploadPreviewDrawer,
  type UploadPreviewPhase,
} from "./resume-upload-preview-drawer";
import {
  resumeCard,
  resumeCardHeader,
  resumeCardSubtext,
  resumeInput,
  resumePrimaryButton,
  resumeSecondaryButton,
  resumeTextarea,
} from "./resume-ui";
import type {
  BuilderSectionInput,
  BuilderSectionKey,
  BuildResumeRequest,
  ResumeDetail,
} from "./types";
import {
  BUILDER_CONTENT_MAX,
  BUILDER_SECTION_OPTIONS,
  MAX_BUILDER_SECTIONS,
  normalizeBuilderSectionName,
} from "./types";

type SectionRow = {
  id: string;
  section_name: BuilderSectionKey;
  content: string;
};

type ResumeBuilderCardProps = {
  initialDetail?: ResumeDetail | null;
  editResumeId?: string | null;
  buildDetail?: ResumeDetail | null;
  onBuildSuccess: (resumeId: string) => void;
  onClearEdit?: () => void;
};

function newSectionRow(
  section_name: BuilderSectionKey = "experience",
): SectionRow {
  return {
    id: crypto.randomUUID(),
    section_name,
    content: "",
  };
}

function detailToRows(detail: ResumeDetail): SectionRow[] {
  if (detail.sections.length === 0) {
    return [newSectionRow()];
  }
  return detail.sections.map((s) => ({
    id: s.id,
    section_name: normalizeBuilderSectionName(s.section_name),
    content: s.content,
  }));
}

export function ResumeBuilderCard({
  initialDetail,
  editResumeId,
  buildDetail,
  onBuildSuccess,
  onClearEdit,
}: ResumeBuilderCardProps) {
  const isEdit = Boolean(editResumeId && initialDetail);
  const formId = useId();

  const [title, setTitle] = useState(initialDetail?.resume.file_name ?? "My CV");
  const [rows, setRows] = useState<SectionRow[]>(() =>
    initialDetail ? detailToRows(initialDetail) : [newSectionRow()],
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPhase, setPreviewPhase] = useState<UploadPreviewPhase>("uploading");
  const [lastBuiltResumeId, setLastBuiltResumeId] = useState<string | null>(null);

  const buildMutation = useBuildResume();
  const rebuildMutation = useRebuildResume();
  const isPending = buildMutation.isPending || rebuildMutation.isPending;

  function validateForm(): BuildResumeRequest | null {
    setLocalError(null);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setLocalError("Please enter a CV title.");
      return null;
    }
    const sections: BuilderSectionInput[] = rows
      .map((r) => ({
        section_name: r.section_name,
        content: r.content.trim(),
      }))
      .filter((s) => s.content.length > 0);

    if (sections.length === 0) {
      setLocalError("Add at least one section with content.");
      return null;
    }
    return { title: trimmedTitle, sections };
  }

  function handleSubmit() {
    const payload = validateForm();
    if (!payload) return;

    setPreviewPhase("uploading");
    setPreviewOpen(true);

    if (isEdit && editResumeId) {
      rebuildMutation.mutate(
        { resumeId: editResumeId, payload },
        {
          onSuccess: (resume) => {
            setPreviewPhase("success");
            setLastBuiltResumeId(resume.id);
            onBuildSuccess(resume.id);
          },
          onError: (error) => {
            setPreviewPhase("error");
            setLocalError(error.message);
          },
        },
      );
    } else {
      buildMutation.mutate(payload, {
        onSuccess: (resume) => {
          setPreviewPhase("success");
          setLastBuiltResumeId(resume.id);
          onBuildSuccess(resume.id);
          if (!initialDetail) {
            setTitle("My CV");
            setRows([newSectionRow()]);
          }
        },
        onError: (error) => {
          setPreviewPhase("error");
          setLocalError(error.message);
        },
      });
    }
  }

  const previewDetail =
    previewPhase === "success" && buildDetail?.resume.id === lastBuiltResumeId
      ? buildDetail
      : null;

  return (
    <>
      <section className={resumeCard}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                <PenLine className="h-4 w-4 text-emerald-700" />
              </div>
              <div>
                <h2 className={resumeCardHeader}>
                  {isEdit ? "Edit CV" : "Build your CV"}
                </h2>
                <p className={resumeCardSubtext}>
                  {isEdit
                    ? "Update sections and re-index for AI search."
                    : "Add sections in plain text — indexed like an upload."}
                </p>
              </div>
            </div>
          </div>
          {isEdit && onClearEdit && (
            <button
              className="shrink-0 text-xs font-medium text-zinc-500 transition hover:text-zinc-800"
              type="button"
              onClick={onClearEdit}
            >
              New CV
            </button>
          )}
        </div>

        <div className="mt-5">
          <label
            className="text-sm font-medium text-zinc-800"
            htmlFor={`${formId}-title`}
          >
            CV title
          </label>
          <input
            className={`${resumeInput} mt-1.5`}
            disabled={isPending}
            id={`${formId}-title`}
            placeholder="e.g. Software Engineer CV"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Sections
          </p>
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-4 ring-1 ring-zinc-950/5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <select
                  className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium capitalize text-zinc-800 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                  disabled={isPending}
                  value={row.section_name}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) =>
                        r.id === row.id
                          ? {
                              ...r,
                              section_name: e.target
                                .value as BuilderSectionKey,
                            }
                          : r,
                      ),
                    )
                  }
                >
                  {BUILDER_SECTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {rows.length > 1 && (
                  <button
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-white hover:text-red-600"
                    type="button"
                    disabled={isPending}
                    aria-label={`Remove section ${index + 1}`}
                    onClick={() =>
                      setRows((prev) => prev.filter((r) => r.id !== row.id))
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
              </div>
              <textarea
                className={`${resumeTextarea} mt-3 min-h-[120px]`}
                disabled={isPending}
                maxLength={BUILDER_CONTENT_MAX}
                placeholder={`Enter your ${row.section_name} content…`}
                rows={5}
                value={row.content}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((r) =>
                      r.id === row.id ? { ...r, content: e.target.value } : r,
                    ),
                  )
                }
              />
              <p className="mt-1 text-right text-xs text-zinc-400">
                {row.content.length.toLocaleString()} /{" "}
                {BUILDER_CONTENT_MAX.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {rows.length < MAX_BUILDER_SECTIONS && (
          <button
            className={`${resumeSecondaryButton} mt-3 w-full`}
            type="button"
            disabled={isPending}
            onClick={() => setRows((prev) => [...prev, newSectionRow("skills")])}
          >
            <Plus className="h-4 w-4" />
            Add section
          </button>
        )}

        {localError && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {localError}
          </p>
        )}

        <button
          className={`${resumePrimaryButton} mt-5 w-full`}
          disabled={isPending}
          type="button"
          onClick={handleSubmit}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Indexing…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isEdit ? "Update & re-index" : "Save & index CV"}
            </>
          )}
        </button>
      </section>

      <ResumeUploadPreviewDrawer
        detail={previewDetail}
        errorMessage={localError ?? buildMutation.error?.message ?? rebuildMutation.error?.message}
        file={null}
        isOpen={previewOpen}
        isUploading={isPending}
        phase={previewPhase}
        source="builder"
        onClose={() => {
          if (!isPending) setPreviewOpen(false);
        }}
      />
    </>
  );
}
