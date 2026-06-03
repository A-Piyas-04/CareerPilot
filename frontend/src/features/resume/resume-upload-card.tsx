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
  resumeInsetPanel,
  resumeModuleTitle,
  resumeCardSubtext,
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

  const dropZoneClass = `flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 transition-all duration-150 ${
    isDragging
      ? "scale-[1.01] border-emerald-600 bg-emerald-50 shadow-md"
      : selectedFile
        ? "border-emerald-600 bg-emerald-50/90 shadow-sm"
        : "border-zinc-400 bg-white hover:border-emerald-600 hover:bg-slate-50 hover:shadow-sm active:scale-[0.99]"
  }`;

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className={resumeModuleTitle}>
            Upload Resume
          </h2>
          <p className={resumeCardSubtext}>
            PDF or DOCX, up to 10 MB. We will extract sections, skills, and
            searchable chunks.
          </p>
        </div>
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
        className={`mt-5 ${embedded ? resumeInsetPanel : ""} ${dropZoneClass}`}
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
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-white">
                  <FileText className="h-6 w-6 text-emerald-700" />
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-900">
                  {selectedFile.name}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                  <span className="font-medium text-emerald-700">
                    View preview
                  </span>
                </p>
              </>
            ) : (
              <>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-white">
                  <FileUp className="h-6 w-6 text-zinc-400" />
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-800">
                  Drag and drop your resume here
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  or click to browse · PDF, DOCX
                </p>
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
