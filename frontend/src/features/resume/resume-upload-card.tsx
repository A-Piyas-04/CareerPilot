"use client";

import { FileUp, Loader2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { validateResumeFile } from "./api";
import { useUploadResume } from "./hooks";

type ResumeUploadCardProps = {
  onUploadSuccess: (resumeId: string) => void;
};

export function ResumeUploadCard({ onUploadSuccess }: ResumeUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = useUploadResume();

  const handleFile = useCallback((file: File | null) => {
    setLocalError(null);
    setSuccessMessage(null);
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
    const file = event.target.files?.[0] ?? null;
    handleFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    handleFile(file);
  }

  function handleUpload() {
    if (!selectedFile) {
      setLocalError("Please select a PDF or DOCX file first.");
      return;
    }

    setLocalError(null);
    setSuccessMessage(null);

    uploadMutation.mutate(selectedFile, {
      onSuccess: (resume) => {
        setSuccessMessage(`Uploaded and processed ${resume.file_name}.`);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onUploadSuccess(resume.id);
      },
      onError: (error) => {
        setLocalError(error.message);
      },
    });
  }

  const isUploading = uploadMutation.isPending;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-950">Upload CV</h2>
      <p className="mt-1 text-sm text-zinc-600">
        PDF and DOCX up to 10 MB. Your resume is parsed into sections, skills,
        and searchable chunks.
      </p>

      <div
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 transition ${
          isDragging
            ? "border-emerald-400 bg-emerald-50"
            : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100/80"
        }`}
        onClick={() => fileInputRef.current?.click()}
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
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <FileUp className="h-8 w-8 text-zinc-400" />
        <p className="mt-2 text-sm font-medium text-zinc-800">
          Drag and drop your resume here
        </p>
        <p className="mt-1 text-xs text-zinc-500">or click to browse</p>
      </div>

      <input
        ref={fileInputRef}
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        type="file"
        onChange={handleInputChange}
      />

      {selectedFile ? (
        <p className="mt-3 text-sm text-zinc-700">
          Selected:{" "}
          <span className="font-medium text-zinc-900">{selectedFile.name}</span>
        </p>
      ) : null}

      {localError ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {localError}
        </p>
      ) : null}

      {uploadMutation.error && !localError ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {uploadMutation.error.message}
        </p>
      ) : null}

      {successMessage ? (
        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {successMessage}
        </p>
      ) : null}

      <button
        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isUploading || !selectedFile}
        type="button"
        onClick={handleUpload}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Upload CV
          </>
        )}
      </button>
    </section>
  );
}
