"use client";

import { CheckCircle2, FileText, FileUp, Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { validateResumeFile } from "./api";
import { useUploadResume } from "./hooks";

type ResumeUploadCardProps = {
  onUploadSuccess: (resumeId: string) => void;
};

type UploadStep = "idle" | "uploading" | "done" | "error";

const STEP_LABELS: Record<UploadStep, string> = {
  idle: "",
  uploading: "Uploading and processing…",
  done: "Done",
  error: "Failed",
};

export function ResumeUploadCard({ onUploadSuccess }: ResumeUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");

  const uploadMutation = useUploadResume();

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
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleUpload() {
    if (!selectedFile) {
      setLocalError("Please select a PDF or DOCX file first.");
      return;
    }
    setLocalError(null);
    setUploadStep("uploading");

    uploadMutation.mutate(selectedFile, {
      onSuccess: (resume) => {
        setUploadStep("done");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onUploadSuccess(resume.id);
        setTimeout(() => setUploadStep("idle"), 3000);
      },
      onError: () => {
        setUploadStep("error");
      },
    });
  }

  const isUploading = uploadStep === "uploading";
  const isDone = uploadStep === "done";

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">Upload CV</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            PDF or DOCX · max 10 MB · parsed into sections, skills &amp; search index
          </p>
        </div>
        {isDone && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Processed
          </span>
        )}
      </div>

      {/* Drop zone */}
      <div
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition-all duration-200 ${
          isDragging
            ? "border-emerald-400 bg-emerald-50 scale-[1.01]"
            : selectedFile
              ? "border-emerald-300 bg-emerald-50/50"
              : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100/60"
        }`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
              <FileText className="h-6 w-6 text-emerald-700" />
            </div>
            <p className="mt-2 text-sm font-semibold text-zinc-900">
              {selectedFile.name}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · click to change
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
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{localError ?? uploadMutation.error?.message}</p>
        </div>
      )}

      {/* Upload step progress */}
      {isUploading && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            {STEP_LABELS.uploading}
          </div>
          <p className="mt-1 text-xs text-amber-700">
            Extracting text → detecting sections → building search index…
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <button
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-55"
          disabled={isUploading || !selectedFile}
          type="button"
          onClick={handleUpload}
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
    </section>
  );
}
