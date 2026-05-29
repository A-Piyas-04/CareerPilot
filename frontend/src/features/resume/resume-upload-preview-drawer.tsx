"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useEffect } from "react";

import { resumeDrawer, resumeOverlay } from "./resume-ui";
import type { ResumeDetail } from "./types";

export type UploadPreviewPhase =
  | "selected"
  | "uploading"
  | "success"
  | "error";

type ResumeUploadPreviewDrawerProps = {
  isOpen: boolean;
  phase: UploadPreviewPhase;
  file: File | null;
  errorMessage?: string | null;
  detail?: ResumeDetail | null;
  onClose: () => void;
  onUpload?: () => void;
  isUploading?: boolean;
  source?: "upload" | "builder";
};

function formatFileType(file: File): string {
  const ext = file.name.includes(".")
    ? file.name.split(".").pop()?.toUpperCase()
    : null;
  if (ext === "PDF" || ext === "DOCX") return ext;
  if (file.type.includes("pdf")) return "PDF";
  if (file.type.includes("wordprocessingml")) return "DOCX";
  return ext ?? "Document";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const PHASE_LABELS: Record<UploadPreviewPhase, string> = {
  selected: "Ready to upload",
  uploading: "Processing",
  success: "Indexed",
  error: "Failed",
};

export function ResumeUploadPreviewDrawer({
  isOpen,
  phase,
  file,
  errorMessage,
  detail,
  onClose,
  onUpload,
  isUploading = false,
  source = "upload",
}: ResumeUploadPreviewDrawerProps) {
  const isBuilder = source === "builder";
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && phase !== "uploading") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, phase]);

  if (!isOpen) {
    return null;
  }

  const sectionNames =
    detail?.resume.parsed_summary?.section_names ??
    detail?.sections.map((s) => s.section_name) ??
    [];

  return (
    <div
      className={resumeOverlay}
      role="presentation"
      onClick={phase !== "uploading" ? onClose : undefined}
    >
      <aside
        className={resumeDrawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 px-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {isBuilder ? "CV builder" : "CV upload"}
            </p>
            <h2
              className="truncate text-lg font-semibold text-zinc-950"
              id="upload-preview-title"
            >
              {file?.name ?? detail?.resume.file_name ?? "Upload preview"}
            </h2>
          </div>
          <button
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40"
            type="button"
            onClick={onClose}
            disabled={phase === "uploading"}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            {phase === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : phase === "error" ? (
              <AlertCircle className="h-5 w-5 text-red-600" />
            ) : phase === "uploading" ? (
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
            ) : (
              <FileText className="h-5 w-5 text-zinc-500" />
            )}
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                phase === "success"
                  ? "bg-emerald-100 text-emerald-800"
                  : phase === "error"
                    ? "bg-red-100 text-red-800"
                    : phase === "uploading"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-zinc-100 text-zinc-700"
              }`}
            >
              {PHASE_LABELS[phase]}
            </span>
          </div>

          {isBuilder && !file && phase !== "success" && phase !== "uploading" && (
            <dl className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 text-sm">
              <dt className="text-xs text-zinc-500">Source</dt>
              <dd className="mt-0.5 font-medium text-emerald-900">
                Built in CareerPilot
              </dd>
            </dl>
          )}

          {/* File metadata */}
          {file && phase !== "success" && (
            <dl className="mt-5 space-y-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm">
              <div>
                <dt className="text-xs text-zinc-500">File name</dt>
                <dd className="mt-0.5 font-medium text-zinc-900 break-all">
                  {file.name}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-zinc-500">Type</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900">
                    {formatFileType(file)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Size</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900">
                    {formatFileSize(file.size)}
                  </dd>
                </div>
              </div>
            </dl>
          )}

          {/* Uploading */}
          {phase === "uploading" && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-900">
                {isBuilder ? "Saving and indexing…" : "Uploading and processing…"}
              </p>
              <p className="mt-1 text-xs text-amber-700">
                {isBuilder
                  ? "Storing sections → chunking → building search index…"
                  : "Extracting text → detecting sections → building search index…"}
              </p>
            </div>
          )}

          {/* Error */}
          {phase === "error" && errorMessage && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Success — stats from ResumeDetail */}
          {phase === "success" && detail && (
            <div className="mt-5 space-y-5">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                  <dt className="text-xs text-zinc-500">Sections</dt>
                  <dd className="mt-1 text-2xl font-semibold text-zinc-900">
                    {detail.sections.length ||
                      detail.resume.parsed_summary?.section_count ||
                      0}
                  </dd>
                </div>
                <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                  <dt className="text-xs text-zinc-500">Skills</dt>
                  <dd className="mt-1 text-2xl font-semibold text-zinc-900">
                    {detail.skills.length ||
                      detail.resume.parsed_summary?.skill_count ||
                      0}
                  </dd>
                </div>
                <div className="col-span-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                  <dt className="text-xs text-zinc-500">Search chunks</dt>
                  <dd className="mt-1 text-2xl font-semibold text-zinc-900">
                    {detail.chunk_count ||
                      detail.resume.parsed_summary?.chunk_count ||
                      0}
                  </dd>
                </div>
              </dl>

              {sectionNames.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Detected sections
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {sectionNames.map((name) => (
                      <span
                        key={name}
                        className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium capitalize text-zinc-700"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {detail.resume.parsed_summary && (
                <p className="text-xs text-zinc-500">
                  Your CV is indexed and ready for AI answers and job matching.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <footer className="shrink-0 border-t border-zinc-200 p-5">
          {phase === "selected" && onUpload && (
            <button
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-55"
              disabled={isUploading}
              type="button"
              onClick={onUpload}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload &amp; Process
                </>
              )}
            </button>
          )}

          {(phase === "success" || phase === "error") && (
            <button
              className="flex h-11 w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              type="button"
              onClick={onClose}
            >
              {phase === "success" ? "Done" : "Close"}
            </button>
          )}

          {phase === "error" && onUpload && file && (
            <button
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              type="button"
              onClick={onUpload}
            >
              <Upload className="h-4 w-4" />
              Try again
            </button>
          )}
        </footer>
      </aside>
    </div>
  );
}
