"use client";

import { CalendarDays, MapPin } from "lucide-react";

import { formatDate, getApplicationTitle, getCompanyLine, getApplicationDeadline } from "./format";
import type { Application } from "./types";

type Props = {
  application: Application;
  onOpen: (application: Application) => void;
};

export function ApplicationCard({ application, onOpen }: Props) {
  const notesSnippet = application.notes?.trim();

  return (
    <button
      className="block w-full rounded-md border border-zinc-200 bg-white p-3 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-200"
      type="button"
      onClick={() => onOpen(application)}
    >
      <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-zinc-950">
        {getApplicationTitle(application)}
      </h3>
      <p className="mt-1 line-clamp-1 text-xs font-medium text-zinc-600">
        {getCompanyLine(application)}
      </p>

      <div className="mt-3 grid gap-1.5 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          Deadline: {formatDate(getApplicationDeadline(application))}
        </span>
        {application.applied_at ? (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Applied: {formatDate(application.applied_at)}
          </span>
        ) : null}
      </div>

      <p className="mt-3 min-h-10 rounded bg-zinc-50 px-2 py-1.5 text-xs leading-5 text-zinc-600">
        {notesSnippet ? notesSnippet : "No notes yet"}
      </p>
    </button>
  );
}
