"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import { useEffect } from "react";

type ResumeDeleteDialogProps = {
  isOpen: boolean;
  fileName: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ResumeDeleteDialog({
  isOpen,
  fileName,
  isPending,
  onCancel,
  onConfirm,
}: ResumeDeleteDialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) onCancel();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4"
      role="presentation"
      onClick={isPending ? undefined : onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-resume-title"
        aria-describedby="delete-resume-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2
                className="text-lg font-semibold text-zinc-950"
                id="delete-resume-title"
              >
                Delete resume?
              </h2>
              <p
                className="mt-1 text-sm text-zinc-600"
                id="delete-resume-desc"
              >
                This will permanently remove{" "}
                <span className="font-medium text-zinc-900">{fileName}</span>,
                including all extracted sections, skills, and search chunks.
                This action cannot be undone.
              </p>
            </div>
          </div>
          <button
            className="shrink-0 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-40"
            type="button"
            onClick={onCancel}
            disabled={isPending}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            className="flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
            type="button"
            disabled={isPending}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            type="button"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete resume
          </button>
        </div>
      </div>
    </div>
  );
}
