"use client";

import { FileText, Layers, Search, Sparkles } from "lucide-react";

import { alertWarning } from "@/lib/ui-theme";

import { resumeStatCard, resumeStatValue } from "../resume-ui";
import { formatResumeDate } from "../types";

type ResumeStatsGridProps = {
  createdAt: string;
  sectionCount: number;
  skillCount: number;
  chunkCount: number;
};

export function ResumeStatsGrid({
  createdAt,
  sectionCount,
  skillCount,
  chunkCount,
}: ResumeStatsGridProps) {
  const stats = [
    { label: "Added", value: formatResumeDate(createdAt), icon: FileText },
    { label: "Sections", value: String(sectionCount), icon: Layers },
    { label: "Skills", value: String(skillCount), icon: Sparkles },
    { label: "Chunks", value: String(chunkCount), icon: Search },
  ] as const;

  return (
    <div>
      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div className={resumeStatCard} key={label}>
            <dt className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              <Icon className="h-3 w-3" />
              {label}
            </dt>
            <dd className={`${resumeStatValue} mt-1`}>{value}</dd>
          </div>
        ))}
      </dl>

      {skillCount === 0 && (
        <p className={`${alertWarning} mt-3 text-xs`}>
          No skills detected yet. Try reprocessing or adding skills manually.
        </p>
      )}
    </div>
  );
}
