"use client";

import { CalendarDays, MapPin } from "lucide-react";

import { fitScoreBadge } from "@/lib/ui-theme";

import { formatDate, getApplicationTitle, getCompanyLine, getApplicationDeadline } from "./format";
import type { Application } from "./types";

type Props = {
  application: Application;
  onOpen: (application: Application) => void;
};

function getFitTier(score: number): "high" | "medium" | "low" {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export function ApplicationCard({ application, onOpen }: Props) {
  const notesSnippet = application.notes?.trim();
  const fitScore = application.job_match?.fit_score;
  const deadline = getApplicationDeadline(application);

  return (
    <button
      className="block w-full rounded-xl border border-zinc-200/90 bg-white p-3 text-left shadow-sm ring-1 ring-zinc-950/[0.02] transition hover:border-violet-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-200"
      type="button"
      onClick={() => onOpen(application)}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-5 text-zinc-950">
          {getApplicationTitle(application)}
        </h3>
        {typeof fitScore === "number" ? (
          <span className={fitScoreBadge(getFitTier(fitScore))}>{fitScore}%</span>
        ) : null}
      </div>
      <p className="mt-1 line-clamp-1 text-xs font-medium text-zinc-600">
        {getCompanyLine(application)}
      </p>

      <div className="mt-3 grid gap-1.5 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          Deadline: {formatDate(deadline)}
        </span>
        {application.applied_at ? (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Applied: {formatDate(application.applied_at)}
          </span>
        ) : null}
      </div>

      <p className="mt-3 min-h-10 rounded-lg bg-zinc-50/90 px-2 py-1.5 text-xs leading-5 text-zinc-600 ring-1 ring-zinc-100">
        {notesSnippet ? notesSnippet : "No notes yet"}
      </p>
    </button>
  );
}
