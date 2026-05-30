"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { btnSecondary } from "@/lib/ui-theme";

import { SpinnerButton } from "./spinner-button";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
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
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div className="flex items-start gap-3">
            {destructive ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            ) : null}
            <div>
              <h2
                className="text-lg font-semibold text-zinc-950"
                id="confirm-dialog-title"
              >
                {title}
              </h2>
              {description ? (
                <p
                  className="mt-1 text-sm text-zinc-600"
                  id="confirm-dialog-desc"
                >
                  {description}
                </p>
              ) : null}
              {children ? (
                <div
                  className="mt-1 text-sm text-zinc-600"
                  id={description ? undefined : "confirm-dialog-desc"}
                >
                  {children}
                </div>
              ) : null}
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
            className={`${btnSecondary} h-10`}
            type="button"
            disabled={isPending}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <SpinnerButton
            type="button"
            variant={destructive ? "danger" : "primary"}
            loading={isPending}
            loadingLabel="Working…"
            onClick={onConfirm}
            className="rounded-lg"
          >
            {confirmLabel}
          </SpinnerButton>
        </div>
      </div>
    </div>
  );
}
