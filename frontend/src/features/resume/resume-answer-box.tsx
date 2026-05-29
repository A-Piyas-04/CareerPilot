"use client";

import { BookOpen, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { ChunkEvidenceCard } from "@/components/resume/chunk-evidence-card";

import { useAskCvQuestion } from "./hooks";
import {
  resumeAiButton,
  resumeAiTextarea,
  resumeCard,
  resumeCardHeader,
  resumeCardSubtext,
} from "./resume-ui";
import type { ResumeStatus } from "./types";

const SAMPLE_QUESTIONS = [
  "Summarize my professional background",
  "What are my strongest technical skills?",
  "Describe my work experience",
  "What projects have I built?",
  "What is my education background?",
];

type ResumeAnswerBoxProps = {
  resumeId?: string;
  resumeStatus?: ResumeStatus;
};

export function ResumeAnswerBox({ resumeId, resumeStatus }: ResumeAnswerBoxProps) {
  const [question, setQuestion] = useState(SAMPLE_QUESTIONS[0]);
  const [showEvidence, setShowEvidence] = useState(false);
  const answerMutation = useAskCvQuestion();

  const canAsk = Boolean(resumeId) && resumeStatus === "processed";
  const result = answerMutation.data;

  function handleAsk() {
    if (!resumeId || !canAsk) return;
    setShowEvidence(false);
    answerMutation.mutate({
      question: question.trim(),
      resume_id: resumeId,
      top_k: 5,
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAsk();
    }
  }

  return (
    <section className={`${resumeCard} overflow-hidden lg:sticky lg:top-[57px]`}>
      <div className="-mx-5 -mt-5 mb-5 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/90 to-white px-5 py-4">
        <div className="flex items-start gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 shadow-sm">
            <Sparkles className="h-4 w-4 text-indigo-700" />
          </div>
          <div>
            <h2 className={resumeCardHeader}>Ask about your CV</h2>
            <p className={resumeCardSubtext}>
              AI answers grounded in your resume — no hallucination.
            </p>
          </div>
        </div>
      </div>

      {/* Sample chips */}
      {canAsk && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {SAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                question === q
                  ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
              onClick={() => setQuestion(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Question textarea */}
      <label
        className="mt-4 block text-sm font-medium text-zinc-800"
        htmlFor="cv-question"
      >
        Your question
      </label>
      <textarea
        id="cv-question"
        className={`${resumeAiTextarea} mt-1.5`}
        disabled={!canAsk || answerMutation.isPending}
        rows={3}
        value={question}
        placeholder="What would you like to know about your CV?"
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      {!canAsk && (
        <p className="mt-2 text-sm text-zinc-500">
          Upload and process a CV first to enable AI answers.
        </p>
      )}

      <button
        className={`${resumeAiButton} mt-3`}
        disabled={!canAsk || answerMutation.isPending || !question.trim()}
        type="button"
        onClick={handleAsk}
      >
        {answerMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Ask AI
          </>
        )}
      </button>
      <p className="mt-1 text-center text-xs text-zinc-400">⌘+Enter to submit</p>

      {/* Error */}
      {answerMutation.error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {answerMutation.error.message}
        </p>
      )}

      {/* Answer */}
      {result && (
        <div className="mt-4 space-y-4">
          {/* AI answer */}
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              AI Answer
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap">
              {result.answer}
            </p>
          </div>

          {/* Evidence toggle */}
          {result.evidence_chunks.length > 0 && (
            <div>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                onClick={() => setShowEvidence((v) => !v)}
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-zinc-400" />
                  CV evidence used ({result.evidence_chunks.length} chunks)
                </span>
                <span className="text-xs text-zinc-400">
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
                  <p className="text-xs text-zinc-400">
                    The answer above was generated solely from these CV excerpts.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state after search */}
      {answerMutation.isSuccess && !result && (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
          No relevant sections found. Try rephrasing your question.
        </div>
      )}
    </section>
  );
}
