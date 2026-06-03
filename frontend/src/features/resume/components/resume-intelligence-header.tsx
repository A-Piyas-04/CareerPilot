"use client";

import { Database, Layers, Search } from "lucide-react";

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

type ResumeIntelligenceHeaderProps = {
  pageBadge: PageBadge;
  sectionCount?: number;
  chunkCount?: number;
  hasActiveResume?: boolean;
};

export function ResumeIntelligenceHeader({
  pageBadge,
  sectionCount,
  chunkCount,
  hasActiveResume,
}: ResumeIntelligenceHeaderProps) {
  return (
    <header className={`${resumePageCard} px-5 py-4`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            CV Intelligence
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
            Resume Intelligence
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-600">
            Upload, analyze, and query your resume with AI-grounded insights.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge tone={BADGE_TONES[pageBadge]}>
            {PAGE_STATUS_LABELS[pageBadge]}
          </Badge>
          {hasActiveResume && (
            <div className="flex flex-wrap items-center justify-end gap-3 rounded-md border border-zinc-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-zinc-600">
              <span className="inline-flex items-center gap-1">
                <Database className="h-3.5 w-3.5 text-zinc-500" />
                Active resume
              </span>
              {sectionCount !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-zinc-500" />
                  {sectionCount} sections
                </span>
              )}
              {chunkCount !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <Search className="h-3.5 w-3.5 text-zinc-500" />
                  {chunkCount} chunks
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
