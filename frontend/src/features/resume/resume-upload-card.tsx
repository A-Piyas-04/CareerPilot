"use client";

import { CheckCircle2, FileText, FileUp, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Badge, SpinnerButton, SubmissionProgress } from "@/components/ui";
import { alertError } from "@/lib/ui-theme";
import { useSimulatedProgress } from "@/hooks/useSimulatedProgress";
import { RESUME_UPLOAD_STEPS } from "@/lib/progress/resume-upload-progress";

import { validateResumeFile } from "./api";
import { useUploadResume } from "./hooks";
import {
  ResumeUploadPreviewDrawer,
  type UploadPreviewPhase,
} from "./resume-upload-preview-drawer";
import {
  resumeDropZoneActive,
  resumeDropZoneFile,
  resumeDropZoneIdle,
  resumeFileTypePill,
  resumeInsetPanel,
  resumePrimaryButton,
} from "./resume-ui";
import type { Resume, ResumeDetail } from "./types";

type ResumeUploadCardProps = {
  onUploadSuccess: (resumeId: string) => void;
  uploadDetail?: ResumeDetail | null;
  embedded?: boolean;
};

type UploadStep = "idle" | "uploading" | "done" | "error";

export function ResumeUploadCard({
  onUploadSuccess,
  uploadDetail,
  embedded = false,
}: ResumeUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPhase, setPreviewPhase] = useState<UploadPreviewPhase>("selected");
  const [lastUploadedResume, setLastUploadedResume] = useState<Resume | null>(
    null,
  );

  const uploadMutation = useUploadResume();
  const isUploading = uploadStep === "uploading";
  const { activeIndex: uploadStepIndex } = useSimulatedProgress({
    isActive: isUploading,
    steps: [...RESUME_UPLOAD_STEPS],
  });

  const handleFile = useCallback((file: File | null) => {
    setLocalError(null);
    setUploadStep("idle");
    if (!file) {
      setSelectedFile(null);
      return;
    }
    try {
      validateResumeFile(file);
      setSelectedFile(file);
      setPreviewPhase("selected");
      setPreviewOpen(true);
    } catch (error) {
      setSelectedFile(null);
      setLocalError(
        error instanceof Error ? error.message : "Invalid file selected.",
      );
    }
  }, []);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0] ?? null);
  }

  function handleClearFile() {
    setSelectedFile(null);
    setLocalError(null);
    setUploadStep("idle");
    setPreviewOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClosePreview() {
    if (uploadStep === "uploading") return;
    setPreviewOpen(false);
    if (previewPhase === "success") {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleUpload() {
    if (!selectedFile) {
      setLocalError("Please select a PDF or DOCX file first.");
      return;
    }
    setLocalError(null);
    setUploadStep("uploading");
    setPreviewPhase("uploading");
    setPreviewOpen(true);

    uploadMutation.mutate(selectedFile, {
      onSuccess: (resume) => {
        setUploadStep("done");
        setPreviewPhase("success");
        setLastUploadedResume(resume);
        onUploadSuccess(resume.id);
        setTimeout(() => setUploadStep("idle"), 3000);
      },
      onError: (error) => {
        setUploadStep("error");
        setPreviewPhase("error");
        setLocalError(error.message);
      },
    });
  }

  const isDone = uploadStep === "done";

  const previewDetail: ResumeDetail | null =
    previewPhase === "success"
      ? uploadDetail ??
        (lastUploadedResume
          ? {
              resume: lastUploadedResume,
              sections: [],
              skills: [],
              chunk_count:
                lastUploadedResume.parsed_summary?.chunk_count ?? 0,
            }
          : null)
      : null;

  function handleDropZoneClick() {
    if (isUploading) return;
    if (selectedFile) {
      setPreviewOpen(true);
      return;
    }
    fileInputRef.current?.click();
  }

  const dropZoneClass = [
    embedded ? resumeInsetPanel : "",
    resumeDropZoneIdle,
    isDragging ? resumeDropZoneActive : "",
    selectedFile && !isDragging ? resumeDropZoneFile : "",
  ]
    .filter(Boolean)
    .join(" ");

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Upload your Resume
        </h2>
        {isDone && (
          <Badge
            tone="completed"
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          >
            Processed
          </Badge>
        )}
      </div>

      <div
        className={`mt-5 ${dropZoneClass}`}
            onClick={handleDropZoneClick}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Upload resume file"
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !isUploading) {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            {selectedFile ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-900/20 ring-4 ring-white/80">
                  <FileText className="h-7 w-7" strokeWidth={1.75} />
                </div>
                <p className="mt-4 max-w-sm truncate text-center text-base font-semibold text-zinc-900">
                  {selectedFile.name}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  <span className="mx-1.5 text-zinc-300">·</span>
                  <span className="font-semibold text-emerald-700 group-hover:underline">
                    Tap to preview
                  </span>
                </p>
              </>
            ) : (
              <>
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200/80 bg-white shadow-sm ring-4 ring-emerald-50 ${
                    isDragging ? "animate-[cp-upload-pulse_1.2s_ease-in-out_infinite]" : ""
                  }`}
                >
                  <FileUp
                    className={`h-7 w-7 ${isDragging ? "text-emerald-600" : "text-zinc-400"}`}
                    strokeWidth={1.75}
                  />
                </div>
                <p className="mt-4 text-base font-semibold text-zinc-800">
                  {isDragging ? "Release to add your file" : "Drag & drop your resume"}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  or <span className="font-medium text-emerald-700">click to browse</span>
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <span className={resumeFileTypePill}>PDF</span>
                  <span className={resumeFileTypePill}>DOCX</span>
                  <span className="text-xs text-zinc-400">· up to 10 MB</span>
                </div>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            type="file"
            onChange={handleInputChange}
          />

          {(localError || uploadMutation.error) && (
            <div className={`${alertError} mt-4 flex items-start gap-2`}>
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{localError ?? uploadMutation.error?.message}</p>
            </div>
          )}

          {isUploading ? (
            <SubmissionProgress
              isActive
              mode="steps"
              steps={[...RESUME_UPLOAD_STEPS]}
              activeStepIndex={uploadStepIndex}
              className="mt-4"
            />
          ) : null}

          <div className="mt-4 flex items-center gap-2">
            <SpinnerButton
              className={`${resumePrimaryButton} flex-1`}
              variant="emerald"
              loading={isUploading}
              loadingLabel="Processing resume..."
              disabled={isUploading || !selectedFile}
              type="button"
              onClick={handleUpload}
              icon={<Upload className="h-4 w-4" />}
              fullWidth
            >
              Upload &amp; Process
            </SpinnerButton>

            {selectedFile && !isUploading && (
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 text-zinc-500 transition-all duration-150 hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-800 active:scale-95"
                type="button"
                aria-label="Clear selected file"
                onClick={handleClearFile}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
    </>
  );

  return (
    <>
      {embedded ? body : <section className="rounded-xl border border-zinc-300 bg-white p-5 shadow-sm">{body}</section>}

      <ResumeUploadPreviewDrawer
        detail={previewDetail}
        errorMessage={localError ?? uploadMutation.error?.message}
        file={selectedFile}
        isOpen={previewOpen}
        isUploading={isUploading}
        uploadStepIndex={uploadStepIndex}
        phase={previewPhase}
        onClose={handleClosePreview}
        onUpload={handleUpload}
      />
    </>
  );
}
