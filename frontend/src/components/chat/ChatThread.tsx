"use client";

import { Bot, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

import { useAssistantMessages, useSendAssistantMessage } from "@/lib/hooks/useAssistantMessages";
import type { AssistantConversation } from "@/lib/types/assistant";

import { ListCardSkeleton } from "@/components/ui";

import type { ActiveJobContext } from "./ChatWorkspace";
import { ChatMessage } from "./ChatMessage";
import { MessageComposer } from "./MessageComposer";

type Props = {
  conversation: AssistantConversation | null;
  jobContext?: ActiveJobContext | null;
};

const DEFAULT_PROMPTS = [
  "What should I focus on this week?",
  "How can I prepare for a backend internship?",
  "Help me organize my job search plan.",
];

function buildJobPrompts(title: string) {
  return [
    `Am I ready for this ${title} role?`,
    "What skills am I missing for this posting?",
    `Build me an 8-week plan to close my gaps for this ${title} role`,
    "Draft a cover letter for this job",
  ];
}

export function ChatThread({ conversation, jobContext }: Props) {
  const messagesQuery = useAssistantMessages(conversation?.id ?? null);
  const sendMessageMutation = useSendAssistantMessage();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const messages = useMemo(
    () => messagesQuery.data ?? [],
    [messagesQuery.data],
  );
  const messageContentKey = useMemo(
    () => messages.map((message) => `${message.id}:${message.content}`).join("|"),
    [messages],
  );

  const suggestedPrompts = useMemo(
    () =>
      jobContext?.title
        ? buildJobPrompts(jobContext.title)
        : DEFAULT_PROMPTS,
    [jobContext?.title],
  );

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messageContentKey]);

  async function handleSend(content: string) {
    if (!conversation) {
      return;
    }

    await sendMessageMutation.mutateAsync({
      conversation,
      content,
      jobId: jobContext?.jobId ?? null,
    });
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[var(--cp-page-bg)]">
      <header className="flex min-h-16 shrink-0 flex-col justify-center gap-2 border-b border-zinc-200 bg-white px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Conversation
            </p>
            <h2 className="truncate text-lg font-semibold text-zinc-950">
              {conversation?.title?.trim() || "No conversation selected"}
            </h2>
          </div>
          <span className="hidden rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800 sm:inline-flex">
            CV-grounded
          </span>
        </div>
        {jobContext ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900">
              Job context: {jobContext.title}
              {jobContext.company ? ` · ${jobContext.company}` : ""}
            </span>
            <Link
              href="/chat"
              className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
              aria-label="Clear job context"
            >
              <X className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        {!conversation ? (
          <EmptyThread
            title="Select or create a conversation"
            description="Your saved career chats will appear here once you choose a thread from the sidebar."
            prompts={suggestedPrompts}
          />
        ) : messagesQuery.isLoading ? (
          <ListCardSkeleton
            count={3}
            cardClassName="h-20 rounded-lg"
            className="mx-auto max-w-4xl space-y-4"
          />
        ) : messagesQuery.error ? (
          <p className="mx-auto max-w-4xl rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {messagesQuery.error.message}
          </p>
        ) : messages.length ? (
          <div className="mx-auto max-w-4xl space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={scrollRef} />
          </div>
        ) : (
          <EmptyThread
            title="Start your career conversation"
            description={
              jobContext
                ? "Ask about readiness, skill gaps, a roadmap, or a cover letter for the selected job posting."
                : "Ask a question now. CareerPilot will respond using the current CV context and recent conversation memory."
            }
            prompts={suggestedPrompts}
            onPromptClick={handleSend}
            disabled={sendMessageMutation.isPending}
          />
        )}
      </div>

      <MessageComposer
        disabled={!conversation}
        isSending={sendMessageMutation.isPending}
        onSend={handleSend}
      />
    </section>
  );
}

function EmptyThread({
  description,
  title,
  prompts,
  onPromptClick,
  disabled,
}: {
  description: string;
  title: string;
  prompts: string[];
  onPromptClick?: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-[420px] max-w-3xl flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
        <Bot className="h-7 w-7" />
      </span>
      <h3 className="mt-4 text-2xl font-semibold text-zinc-950">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
        {description}
      </p>
      <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
        {prompts.map((prompt) =>
          onPromptClick ? (
            <button
              type="button"
              key={prompt}
              disabled={disabled}
              onClick={() => onPromptClick(prompt)}
              className="rounded-lg border border-zinc-200 bg-white p-3 text-left text-sm font-medium text-zinc-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 disabled:opacity-50"
            >
              <Sparkles className="mb-2 h-4 w-4 text-sky-600" />
              {prompt}
            </button>
          ) : (
            <div
              className="rounded-lg border border-zinc-200 bg-white p-3 text-left text-sm font-medium text-zinc-700 shadow-sm"
              key={prompt}
            >
              <Sparkles className="mb-2 h-4 w-4 text-sky-600" />
              {prompt}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
