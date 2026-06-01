"use client";

import { CalendarDays, MapPin } from "lucide-react";

import { formatDate, getApplicationTitle, getCompanyLine } from "./format";
import type { Application } from "./types";

type Props = {
  application: Application;
  onOpen: (application: Application) => void;
};

export function ApplicationCard({ application, onOpen }: Props) {
  const notesSnippet = application.notes?.trim();

  return (
    <button
      className="block w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--shadow-soft)] focus:outline-none focus:ring-4 focus:ring-[var(--ring)]"
      type="button"
      onClick={() => onOpen(application)}
    >
      <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[var(--foreground)]">
        {getApplicationTitle(application)}
      </h3>
      <p className="mt-1 line-clamp-1 text-xs font-medium text-[var(--muted-foreground)]">
        {getCompanyLine(application)}
      </p>

      <div className="mt-3 grid gap-1.5 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          Deadline: {formatDate(application.deadline)}
        </span>
        {application.applied_at ? (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Applied: {formatDate(application.applied_at)}
          </span>
        ) : null}
      </div>

      <p className="mt-3 min-h-10 rounded-xl bg-[var(--surface-subtle)] px-2 py-1.5 text-xs leading-5 text-[var(--muted-foreground)]">
        {notesSnippet ? notesSnippet : "No notes yet"}
      </p>
    </button>
  );
}
