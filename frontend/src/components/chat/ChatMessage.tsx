"use client";

import { format } from "date-fns";
import { Bot, ChevronDown, Loader2, User } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

import { Badge } from "@/components/ui";
import { saveCoverLetter, saveRoadmap } from "@/lib/career-api";
import { btnPrimarySky, surfaceCardElevated } from "@/lib/ui-theme";
import type { AssistantMessage } from "@/lib/types/assistant";

import { getIntentFromMetadata, IntentBadge } from "./intent-badge";

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
  const intent = !isUser ? getIntentFromMetadata(message.metadata) : null;

  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse justify-start" : "justify-start"}`}
    >
      <span
        className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-sky-500 to-sky-700 text-white"
            : "border border-sky-100 bg-sky-50 text-sky-700"
        }`}
        aria-hidden
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </span>
      <article
        className={`group max-w-[min(78%,42rem)] px-4 py-3 shadow-sm ${
          isUser
            ? "rounded-2xl rounded-tr-md bg-gradient-to-br from-sky-600 via-sky-600 to-sky-700 text-white shadow-md shadow-sky-900/15 ring-1 ring-sky-500/20"
            : "rounded-2xl rounded-tl-md border border-zinc-200/90 bg-white text-zinc-900 ring-1 ring-zinc-950/[0.03]"
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
            {intent ? (
              <div className="mb-2">
                <IntentBadge intent={intent} />
              </div>
            ) : null}
            <div className="prose prose-sm max-w-none prose-zinc prose-headings:text-zinc-900 prose-a:text-sky-700 leading-6">
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
            isUser ? "text-sky-100" : "text-zinc-400"
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
    <div className="mt-4 border-t border-sky-100 pt-3">
      <button
        className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1 text-left transition hover:bg-sky-50/80"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-sky-800">
            Based on your CV
          </span>
          <Badge tone="sky">{chunks.length} sections</Badge>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-sky-600 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="mt-3 space-y-2">
          {chunks.map((chunk) => (
            <ChatEvidenceCard chunk={chunk} key={chunk.chunk_id} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ChatEvidenceCard({ chunk }: { chunk: EvidenceChunk }) {
  const matchPct = Math.round(chunk.similarity * 100);

  return (
    <article className={`${surfaceCardElevated} p-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone="neutral" className="capitalize">
          {chunk.section_name ?? "General"}
        </Badge>
        <Badge tone="sky">{matchPct}% match</Badge>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700">
        {truncateEvidenceText(chunk.chunk_text, 280)}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sky-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600"
          style={{ width: `${matchPct}%` }}
        />
      </div>
    </article>
  );
}

function truncateEvidenceText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
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
    <div className="mt-4 border-t border-sky-100 pt-3">
      <button
        className={`${btnPrimarySky} h-9 px-3 text-xs disabled:opacity-60`}
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
  const intent = getIntentFromMetadata(message.metadata);
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
