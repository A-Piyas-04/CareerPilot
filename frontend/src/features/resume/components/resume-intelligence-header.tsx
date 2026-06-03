"use client";

import { Database, Layers, Search, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui";
import type { BadgeTone } from "@/components/ui";

import { resumePageCard } from "../resume-ui";
import { PAGE_STATUS_LABELS, type getPageStatusBadge } from "../types";

type PageBadge = ReturnType<typeof getPageStatusBadge>;

const BADGE_TONES: Record<PageBadge, BadgeTone> = {
  no_cv: "neutral",
  processing: "inProgress",
  failed: "amber",
  rag_ready: "rag",
};

const STATUS_HINTS: Record<PageBadge, string> = {
  no_cv: "Add a resume below to enable AI search and job matching.",
  processing: "We're parsing your file — this usually takes under a minute.",
  failed: "Something went wrong during processing. Try re-uploading.",
  rag_ready: "Your resume is indexed and ready for grounded AI answers.",
};

type ResumeIntelligenceHeaderProps = {
  pageBadge: PageBadge;
  sectionCount?: number;
  chunkCount?: number;
  hasActiveResume?: boolean;
};

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Database;
  label: string;
  value?: number;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-white px-2.5 py-1.5 shadow-sm">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span className="text-xs text-zinc-500">
        {value !== undefined ? (
          <>
            <span className="font-bold tabular-nums text-zinc-900">{value}</span>{" "}
            {label}
          </>
        ) : (
          label
        )}
      </span>
    </span>
  );
}

export function ResumeIntelligenceHeader({
  pageBadge,
  sectionCount,
  chunkCount,
  hasActiveResume,
}: ResumeIntelligenceHeaderProps) {
  return (
    <header
      className={`${resumePageCard} relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6`}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-800"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-start justify-between gap-5 pl-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm shadow-emerald-900/20">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
              CV Intelligence
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-[1.65rem]">
            Resume Intelligence
          </h1>
          <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-zinc-600">
            Upload, analyze, and ask questions about your resume — every answer
            is grounded in your actual experience.
          </p>
          <p className="mt-2 text-xs text-zinc-500">{STATUS_HINTS[pageBadge]}</p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
          <Badge tone={BADGE_TONES[pageBadge]} className="self-start sm:self-end">
            {PAGE_STATUS_LABELS[pageBadge]}
          </Badge>
          {hasActiveResume && (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <StatPill icon={Database} label="Active resume" />
              {sectionCount !== undefined && (
                <StatPill
                  icon={Layers}
                  label={sectionCount === 1 ? "section" : "sections"}
                  value={sectionCount}
                />
              )}
              {chunkCount !== undefined && (
                <StatPill
                  icon={Search}
                  label={chunkCount === 1 ? "chunk" : "chunks"}
                  value={chunkCount}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
