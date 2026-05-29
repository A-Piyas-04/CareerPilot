"use client";

import { format } from "date-fns";
import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";

import type { CoverLetter } from "@/lib/cover-letter/types";

type CoverLetterCardProps = {
  coverLetter: CoverLetter;
};

export function CoverLetterCard({ coverLetter }: CoverLetterCardProps) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
            <FileText className="h-3.5 w-3.5" />
            <span>Version {coverLetter.version}</span>
            <span>{safeDate(coverLetter.updated_at)}</span>
          </div>
          <h2 className="mt-2 text-base font-semibold text-zinc-950">
            {coverLetter.job_title || coverLetter.title || "Cover letter"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {coverLetter.company_name || "Company not set"}
          </p>
        </div>
        <Link
          href={`/cover-letters/${coverLetter.id}`}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:border-[#1A56DB] hover:text-[#1A56DB]"
        >
          View
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">
        {coverLetter.content}
      </p>
    </article>
  );
}

function safeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : format(date, "MMM d, yyyy");
}
