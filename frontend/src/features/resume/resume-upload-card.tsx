"use client";

import { CheckCircle2, FileText, FileUp, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Badge, SpinnerButton, SubmissionProgress, SurfaceCard } from "@/components/ui";
import { alertError, iconTile } from "@/lib/ui-theme";
import { useSimulatedProgress } from "@/hooks/useSimulatedProgress";
import { RESUME_UPLOAD_STEPS } from "@/lib/progress/resume-upload-progress";

import { validateResumeFile } from "./api";
import { useUploadResume } from "./hooks";
import {
  ResumeUploadPreviewDrawer,
  type UploadPreviewPhase,
} from "./resume-upload-preview-drawer";
import {
  resumeCardBody,
  resumeCardHeader,
  resumeCardSubtext,
  resumePrimaryButton,
} from "./resume-ui";
import type { Resume, ResumeDetail } from "./types";

type ResumeUploadCardProps = {
  onUploadSuccess: (resumeId: string) => void;
  uploadDetail?: ResumeDetail | null;
};

type UploadStep = "idle" | "uploading" | "done" | "error";

export function ResumeUploadCard({
  onUploadSuccess,
  uploadDetail,
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

  return (
    <>
      <SurfaceCard
        accent="emerald"
        premium
        header={
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className={resumeCardHeader}>Upload CV</h2>
              <p className={resumeCardSubtext}>
                PDF or DOCX · max 10 MB · parsed into sections, skills &amp; search index
              </p>
            </div>
            {isDone && (
              <Badge tone="completed" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                Processed
              </Badge>
            )}
          </div>
        }
        bodyClassName={resumeCardBody}
      >

        {/* Drop zone */}
        <div
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 transition-all duration-200 ${
            isDragging
              ? "border-emerald-400 bg-emerald-50 scale-[1.01]"
              : selectedFile
                ? "border-emerald-300 bg-emerald-50/50"
                : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100/60"
          }`}
          onClick={handleDropZoneClick}
          onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
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
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconTile("emerald")}`}>
                <FileText className="h-6 w-6" />
              </div>
              <p className="mt-2 text-sm font-semibold text-zinc-900">
                {selectedFile.name}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                <span className="text-indigo-600">View preview</span>
              </p>
            </>
          ) : (
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100">
                <FileUp className="h-6 w-6 text-zinc-400" />
              </div>
              <p className="mt-2 text-sm font-semibold text-zinc-700">
                Drag &amp; drop your resume here
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">or click to browse files</p>
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

        {/* Error */}
        {(localError || uploadMutation.error) && (
          <div className={`${alertError} mt-3 flex items-start gap-2`}>
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
            className="mt-3"
          />
        ) : null}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <SpinnerButton
            className={`${resumePrimaryButton} flex-1`}
            loading={isUploading}
            loadingLabel="Processing…"
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
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700"
              type="button"
              aria-label="Clear selected file"
              onClick={handleClearFile}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </SurfaceCard>

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
