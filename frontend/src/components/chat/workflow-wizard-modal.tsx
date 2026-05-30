"use client";

import { X } from "lucide-react";
import { useEffect, type FormEvent, type ReactNode } from "react";

import { SpinnerButton } from "@/components/ui";
import {
  btnSecondary,
  inputFieldSky,
  pageTitle,
  surfaceCardElevated,
  surfaceCardHeader,
  textareaFieldSky,
} from "@/lib/ui-theme";

type WorkflowWizardModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  submitLabel?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function WorkflowWizardModal({
  isOpen,
  title,
  description,
  children,
  submitLabel = "Send to assistant",
  isSubmitting = false,
  onClose,
  onSubmit,
}: WorkflowWizardModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4"
      role="presentation"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className={`${surfaceCardElevated} max-h-[90vh] w-full max-w-lg overflow-y-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="workflow-wizard-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`${surfaceCardHeader("sky")} flex items-start justify-between gap-3`}>
          <div>
            <h2 className={`${pageTitle} text-xl`} id="workflow-wizard-title">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-zinc-600">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-sky-600 transition hover:bg-sky-100 hover:text-sky-800 disabled:opacity-40"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4 p-5" onSubmit={onSubmit}>
          {children}
          <div className="flex flex-col-reverse gap-2 border-t border-sky-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              className={`${btnSecondary} h-10 border-sky-100 hover:border-sky-200 hover:bg-sky-50`}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <SpinnerButton
              type="submit"
              variant="sky"
              loading={isSubmitting}
              loadingLabel="Sending…"
              className="h-10 rounded-lg"
            >
              {submitLabel}
            </SpinnerButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export function WizardField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-900">{label}</span>
      {hint ? <span className="mb-2 block text-xs text-zinc-500">{hint}</span> : null}
      {children}
    </label>
  );
}

export function WizardInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputFieldSky} {...props} />;
}

export function WizardTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return <textarea className={`${textareaFieldSky} min-h-24`} {...props} />;
}

export function WizardSelect(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select
      className={`${inputFieldSky} bg-white`}
      {...props}
    />
  );
}
