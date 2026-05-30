"use client";

import { format } from "date-fns";
import { ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

import { ChunkEvidenceCard } from "@/components/resume/chunk-evidence-card";
import type { AssistantIntent } from "@/lib/assistant/detectIntent";
import { saveCoverLetter, saveRoadmap } from "@/lib/career-api";
import type { AssistantMessage } from "@/lib/types/assistant";

type Props = {
  message: AssistantMessage;
};

type EvidenceChunk = {
  chunk_id: string;
  section_name: string | null;
  chunk_text: string;
  similarity: number;
};

export function ChatMessage({ message }: Props) {
  if (message.role === "system") {
    return (
      <div className="flex justify-center">
        <div className="max-w-2xl rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-500">
          {message.content}
        </div>
      </div>
    );
  }

  const isUser = message.role === "user";
  const action = assistantMessageAction(message);
  const evidenceChunks = parseEvidenceChunks(message);
  const hasResume = message.metadata?.has_resume === true;
  const showNoResumeBanner =
    !isUser && message.metadata?.has_resume === false;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <article
        className={`group max-w-[78%] rounded-lg px-4 py-3 shadow-sm ${
          isUser
            ? "bg-sky-600 text-white"
            : "border border-zinc-200 bg-white text-zinc-900"
        }`}
      >
        {showNoResumeBanner ? (
          <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            No CV on file — upload your resume at{" "}
            <a className="font-semibold underline" href="/resume">
              /resume
            </a>{" "}
            for grounded answers.
          </p>
        ) : null}

        {isUser ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-6">
            {message.content}
          </p>
        ) : (
          <>
            <div className="prose prose-sm max-w-none prose-zinc leading-6">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            {hasResume && evidenceChunks.length > 0 ? (
              <CvEvidenceSection chunks={evidenceChunks} />
            ) : null}
          </>
        )}

        {action ? <DraftAction message={message} action={action} /> : null}

        <p
          className={`mt-2 text-[11px] font-medium opacity-0 transition group-hover:opacity-100 ${
            isUser ? "text-blue-100" : "text-zinc-400"
          }`}
        >
          {format(new Date(message.created_at), "MMM d, h:mm a")}
        </p>
      </article>
    </div>
  );
}

function CvEvidenceSection({ chunks }: { chunks: EvidenceChunk[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 border-t border-zinc-100 pt-3">
      <button
        className="flex w-full items-center justify-between gap-2 text-left text-xs font-semibold text-indigo-700"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <span>Based on your CV ({chunks.length} sections)</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="mt-2 space-y-2">
          {chunks.map((chunk) => (
            <ChunkEvidenceCard chunk={chunk} key={chunk.chunk_id} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DraftAction({
  message,
  action,
}: {
  message: AssistantMessage;
  action: {
    label: string;
    kind: "cover_letter" | "roadmap";
  };
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setStatus(null);
    try {
      const sourceMessage =
        typeof message.metadata?.source_user_message === "string"
          ? message.metadata.source_user_message
          : message.content;
      const resumeId =
        typeof message.metadata?.resume_id === "string"
          ? message.metadata.resume_id
          : null;
      const targetRole =
        typeof message.metadata?.target_role === "string"
          ? message.metadata.target_role
          : undefined;

      if (action.kind === "cover_letter") {
        const result = await saveCoverLetter({
          job_description: sourceMessage,
          resume_id: resumeId,
          target_role: targetRole,
          title: "Cover letter from assistant",
        });
        setStatus(
          `Saved cover letter (${result.used_resume_chunks.length} CV sections used).`,
        );
      } else {
        const role =
          targetRole ||
          extractTargetRole(sourceMessage) ||
          "Target role";
        const weeks = extractWeekCount(sourceMessage) ?? 8;
        const result = await saveRoadmap({
          target_role: role,
          duration_weeks: weeks,
          resume_id: resumeId,
          job_description: sourceMessage,
        });
        setStatus(
          `Saved ${result.item_count}-week roadmap (${result.used_resume_chunks.length} CV sections used).`,
        );
      }
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not save. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 border-t border-zinc-100 pt-3">
      <button
        className="inline-flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 disabled:opacity-60"
        disabled={loading}
        type="button"
        onClick={() => void handleSave()}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {action.label}
      </button>
      {status ? (
        <p className="mt-2 text-xs text-zinc-600">{status}</p>
      ) : null}
    </div>
  );
}

function assistantMessageAction(message: AssistantMessage) {
  const intent = message.metadata?.intent as AssistantIntent | undefined;
  const canSaveCover =
    message.metadata?.can_save_cover_letter === true;
  const canSaveRoadmap = message.metadata?.can_save_roadmap === true;

  if (intent === "roadmap_generation" && canSaveRoadmap) {
    return { label: "Save Roadmap", kind: "roadmap" as const };
  }

  if (intent === "cover_letter" && canSaveCover) {
    return { label: "Save Cover Letter", kind: "cover_letter" as const };
  }

  return null;
}

function parseEvidenceChunks(message: AssistantMessage): EvidenceChunk[] {
  const raw = message.metadata?.evidence_chunks;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(isEvidenceChunk);
}

function isEvidenceChunk(value: unknown): value is EvidenceChunk {
  if (!value || typeof value !== "object") {
    return false;
  }
  const chunk = value as Record<string, unknown>;
  return (
    typeof chunk.chunk_id === "string" &&
    typeof chunk.chunk_text === "string" &&
    typeof chunk.similarity === "number"
  );
}

function extractTargetRole(text: string): string | null {
  const match = text.match(
    /\b(?:become|for|as)\s+(?:a|an)?\s*([a-z][a-z0-9\s/-]{2,40})/i,
  );
  return match?.[1]?.trim() ?? null;
}

function extractWeekCount(text: string): number | null {
  const match = text.match(/\b(\d{1,2})\s*[- ]?\s*week/i);
  if (!match) {
    return null;
  }
  const weeks = Number(match[1]);
  return Number.isFinite(weeks) ? weeks : null;
}
