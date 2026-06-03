"use client";

import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/ui";

import { resumeSecondaryButton, resumeSectionRow } from "../resume-ui";
import type { ResumeSection } from "../types";

function SectionRow({
  section,
  onViewFull,
}: {
  section: ResumeSection;
  onViewFull: (section: ResumeSection) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const previewLength = 140;
  const preview = section.content.slice(0, previewLength);
  const hasMore = section.content.length > previewLength;

  return (
    <li className={resumeSectionRow}>
      <button
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold capitalize text-zinc-800">
              {section.section_name}
            </span>
            <span className="text-xs text-zinc-400">
              {section.content.length} chars
            </span>
          </div>
          {!expanded && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600">
              {preview}
              {hasMore ? "…" : ""}
            </p>
          )}
        </div>
        {hasMore && (
          <span className="mt-0.5 shrink-0 text-zinc-400">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-zinc-100 bg-zinc-50/60 px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
            {section.content}
          </p>
        </div>
      )}

      {hasMore && (
        <div className="border-t border-zinc-100 px-4 py-2.5">
          <button
            className={resumeSecondaryButton}
            type="button"
            onClick={() => onViewFull(section)}
          >
            View full section
          </button>
        </div>
      )}
    </li>
  );
}

type ExtractedSectionsListProps = {
  sections: ResumeSection[];
  onViewFull: (section: ResumeSection) => void;
};

export function ExtractedSectionsList({
  sections,
  onViewFull,
}: ExtractedSectionsListProps) {
  if (sections.length === 0) {
    return (
      <EmptyState
        accent="emerald"
        icon={Layers}
        title="No sections found"
        description="Sections appear after your resume is processed. Try uploading again or use the manual editor."
        variant="dashed"
        className="py-6"
      />
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-900">
        Extracted sections
        <span className="ml-2 font-normal text-zinc-500">
          ({sections.length})
        </span>
      </h3>
      <ul className="mt-3 space-y-2">
        {sections.map((section) => (
          <SectionRow
            key={section.id}
            section={section}
            onViewFull={onViewFull}
          />
        ))}
      </ul>
    </div>
  );
}
