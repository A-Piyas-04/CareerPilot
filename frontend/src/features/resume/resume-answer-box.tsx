"use client";

import { Bot, Loader2, MessageSquareText } from "lucide-react";
import { useState } from "react";

import { alertError } from "@/lib/ui-theme";

import { ResumeAnswerCard } from "./components/resume-answer-card";
import { useAskCvQuestion } from "./hooks";
import {
  resumeAiButton,
  resumeAiTextarea,
  resumePageCard,
  resumeCardBody,
  resumeCardHeader,
  resumePromptChip,
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

export function ResumeAnswerBox({
  resumeId,
  resumeStatus,
}: ResumeAnswerBoxProps) {
  const [question, setQuestion] = useState("");
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const answerMutation = useAskCvQuestion();

  const canAsk = Boolean(resumeId) && resumeStatus === "processed";
  const result = answerMutation.data;

  function handleAsk() {
    if (!resumeId || !canAsk) return;
    const trimmed = question.trim();
    if (!trimmed) return;
    setShowEvidence(false);
    answerMutation.mutate({
      question: trimmed,
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

  function selectChip(prompt: string) {
    setActiveChip(prompt);
    setQuestion(prompt);
  }

  return (
    <section className={resumePageCard}>
      <div className={resumeCardBody}>
        <div className="flex items-start gap-3 border-b border-zinc-200 pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-slate-100">
            <Bot className="h-5 w-5 text-emerald-800" />
          </div>
          <div>
            <h2 className={`${resumeCardHeader} border-0 pb-0`}>
              Ask about your resume
            </h2>
          </div>
        </div>

        {canAsk && (
          <div className="mt-4 flex flex-wrap gap-2">
            {SAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                className={resumePromptChip(activeChip === q)}
                onClick={() => selectChip(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <label
          className="mt-5 block text-sm font-medium text-zinc-800"
          htmlFor="cv-question"
        >
          Your question
        </label>
        <textarea
          id="cv-question"
          className={`${resumeAiTextarea} mt-1.5`}
          disabled={!canAsk || answerMutation.isPending}
          rows={4}
          value={question}
          placeholder="Ask anything about your resume..."
          onChange={(e) => {
            setQuestion(e.target.value);
            if (activeChip && e.target.value !== activeChip) {
              setActiveChip(null);
            }
          }}
          onKeyDown={handleKeyDown}
        />

        {!canAsk && (
          <p className="mt-2 text-sm text-zinc-500">
            Upload and process a resume first to enable AI answers.
          </p>
        )}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            className={resumeAiButton}
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
              "Ask AI"
            )}
          </button>
          <p className="text-xs text-zinc-400">Ctrl + Enter to submit</p>
        </div>

        {answerMutation.error && (
          <div className={`${alertError} mt-4 flex items-start gap-2`}>
            <p>{answerMutation.error.message}</p>
          </div>
        )}

        {result && (
          <div className="mt-5">
            <ResumeAnswerCard
              result={result}
              showEvidence={showEvidence}
              onToggleEvidence={() => setShowEvidence((v) => !v)}
            />
          </div>
        )}

        {!result && !answerMutation.isPending && canAsk && (
          <div className="mt-5 rounded-lg border border-dashed border-zinc-300 bg-slate-50 px-4 py-8 text-center">
            <MessageSquareText className="mx-auto h-6 w-6 text-zinc-400" />
            <p className="mt-2 text-sm font-medium text-zinc-700">
              No answer yet
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Pick a quick prompt or type a question to get started.
            </p>
          </div>
        )}

        {answerMutation.isSuccess && !result && (
          <div className="mt-5 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
            No relevant sections found. Try rephrasing your question.
          </div>
        )}
      </div>
    </section>
  );
}
