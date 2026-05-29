"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import { resumeDrawer, resumeOverlay, resumeSecondaryButton } from "./resume-ui";
import type { ResumeSection } from "./types";

type ResumeSectionViewerDrawerProps = {
  section: ResumeSection | null;
  isOpen: boolean;
  onClose: () => void;
};

function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function ResumeSectionViewerDrawer({
  section,
  isOpen,
  onClose,
}: ResumeSectionViewerDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !section) {
    return null;
  }

  const metadataEntries =
    section.metadata && typeof section.metadata === "object"
      ? Object.entries(section.metadata).filter(
          ([, v]) => v !== null && v !== undefined && v !== "",
        )
      : [];

  return (
    <div className={resumeOverlay} role="presentation" onClick={onClose}>
      <aside
        className={`${resumeDrawer} max-w-xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="section-viewer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Section
            </p>
            <h2
              className="mt-0.5 text-lg font-semibold capitalize text-zinc-950"
              id="section-viewer-title"
            >
              {section.section_name}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {section.content.length.toLocaleString()} characters
              {section.section_order > 0
                ? ` · order ${section.section_order}`
                : ""}
            </p>
          </div>
          <button
            className="shrink-0 rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
              {section.content}
            </p>
          </div>

          {metadataEntries.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Metadata
              </h3>
              <dl className="mt-2 space-y-2">
                {metadataEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-lg border border-zinc-100 bg-white px-3 py-2"
                  >
                    <dt className="text-xs font-medium capitalize text-zinc-500">
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="mt-0.5 text-sm text-zinc-800">
                      {formatMetadataValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-zinc-200 p-5">
          <button
            className={`${resumeSecondaryButton} w-full`}
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </aside>
    </div>
  );
}
