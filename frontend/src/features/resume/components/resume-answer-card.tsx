"use client";

import { BookOpen, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { ChunkEvidenceCard } from "@/components/resume/chunk-evidence-card";

import type { CvAnswerResponse } from "../types";

type ResumeAnswerCardProps = {
  result: CvAnswerResponse;
  showEvidence: boolean;
  onToggleEvidence: () => void;
};

export function ResumeAnswerCard({
  result,
  showEvidence,
  onToggleEvidence,
}: ResumeAnswerCardProps) {
  return (
    <div className="space-y-4">
      <article className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">
          <MessageSquare className="h-3.5 w-3.5" />
          Answer
        </div>
        <div className="resume-answer-markdown mt-2 text-sm leading-relaxed text-zinc-800">
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p className="mb-2 last:mb-0">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-zinc-900">{children}</strong>
              ),
              ul: ({ children }) => (
                <ul className="my-2 list-disc space-y-1.5 pl-5">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="my-2 list-decimal space-y-1.5 pl-5">{children}</ol>
              ),
              li: ({ children }) => <li>{children}</li>,
            }}
          >
            {result.answer}
          </ReactMarkdown>
        </div>
      </article>

      {result.evidence_chunks.length > 0 && (
        <div>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            onClick={onToggleEvidence}
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-zinc-400" />
              Source evidence ({result.evidence_chunks.length} chunks)
            </span>
            <span className="text-xs text-zinc-500">
              {showEvidence ? "Hide" : "Show"}
            </span>
          </button>

          {showEvidence && (
            <div className="mt-2 space-y-2">
              {result.evidence_chunks.map((chunk) => (
                <ChunkEvidenceCard
                  chunk={chunk}
                  key={chunk.chunk_id}
                  variant="full"
                />
              ))}
              <p className="text-xs text-zinc-500">
                This answer was generated from the resume excerpts above.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
