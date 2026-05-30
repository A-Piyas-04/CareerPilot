"use client";

import { Bot, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

import { useAssistantMessages, useSendAssistantMessage } from "@/lib/hooks/useAssistantMessages";
import type { AssistantConversation } from "@/lib/types/assistant";

import { Badge, ListCardSkeleton } from "@/components/ui";
import { chipSky, surfaceCardElevated, surfaceCardHeader } from "@/lib/ui-theme";

import { getIntentFromMetadata, IntentBadge } from "./intent-badge";
import { GuidedWorkflows } from "./guided-workflows";
import type { ActiveJobContext } from "./ChatWorkspace";
import { ChatMessage } from "./ChatMessage";
import { MessageComposer } from "./MessageComposer";

type Props = {
  conversation: AssistantConversation | null;
  jobContext?: ActiveJobContext | null;
  onCreateConversation?: () => void;
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

export function ChatThread({
  conversation,
  jobContext,
  onCreateConversation,
}: Props) {
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
    [jobContext],
  );

  const latestIntent = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role !== "assistant") continue;
      const intent = getIntentFromMetadata(message.metadata);
      if (intent) return intent;
    }
    return null;
  }, [messages]);

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

  function handlePromptClick(prompt: string) {
    if (conversation) {
      void handleSend(prompt);
      return;
    }

    onCreateConversation?.();
  }

  const promptsDisabled =
    sendMessageMutation.isPending ||
    (!conversation && !onCreateConversation);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-[var(--cp-page-bg)] to-sky-50/20">
      <header
        className={`${surfaceCardHeader("sky")} flex min-h-16 shrink-0 flex-col justify-center gap-2 py-3`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Conversation
            </p>
            <h2 className="truncate text-lg font-semibold tracking-tight text-zinc-950">
              {conversation?.title?.trim() || "No conversation selected"}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {latestIntent ? <IntentBadge intent={latestIntent} /> : null}
            <Badge tone="sky" className="hidden sm:inline-flex">
              CV-grounded
            </Badge>
          </div>
        </div>
        {jobContext ? (
          <div className="flex items-center gap-2">
            <Badge tone="emerald" className="max-w-full truncate capitalize">
              Job context: {jobContext.title}
              {jobContext.company ? ` · ${jobContext.company}` : ""}
            </Badge>
            <Link
              href="/chat"
              className="rounded-lg p-1.5 text-sky-600 transition hover:bg-sky-100 hover:text-sky-800"
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
            description="Your saved career chats will appear here once you choose a thread from the sidebar — or start a new chat with a suggested prompt below."
            prompts={suggestedPrompts}
            onPromptClick={handlePromptClick}
            disabled={promptsDisabled}
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
            onPromptClick={handlePromptClick}
            disabled={promptsDisabled}
            workflows={
              conversation ? (
                <GuidedWorkflows
                  jobContext={jobContext}
                  disabled={sendMessageMutation.isPending}
                  onSubmitPrompt={handleSend}
                />
              ) : null
            }
          />
        )}
      </div>

      {conversation && messages.length > 0 ? (
        <div className="border-t border-sky-100/80 bg-white/80 px-5 py-3 backdrop-blur-sm">
          <GuidedWorkflows
            jobContext={jobContext}
            disabled={sendMessageMutation.isPending}
            onSubmitPrompt={handleSend}
            compact
          />
        </div>
      ) : null}

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
  workflows,
}: {
  description: string;
  title: string;
  prompts: string[];
  onPromptClick?: (prompt: string) => void;
  disabled?: boolean;
  workflows?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[420px] max-w-3xl flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-800 text-white shadow-md shadow-sky-900/25">
        <Bot className="h-7 w-7" />
      </span>
      <h3 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">
        {title}
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
        {description}
      </p>
      <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
        {prompts.map((prompt) =>
          onPromptClick ? (
            <button
              type="button"
              key={prompt}
              disabled={disabled}
              onClick={() => onPromptClick(prompt)}
              className={`${surfaceCardElevated} group p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-900/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0`}
            >
              <Sparkles className="mb-2 h-4 w-4 text-sky-600 transition group-hover:text-sky-700" />
              <span className="text-sm font-medium leading-6 text-zinc-800 group-hover:text-sky-950">
                {prompt}
              </span>
            </button>
          ) : (
            <div
              className={`${surfaceCardElevated} p-4 text-left`}
              key={prompt}
            >
              <Sparkles className="mb-2 h-4 w-4 text-sky-600" />
              <span className="text-sm font-medium leading-6 text-zinc-700">
                {prompt}
              </span>
            </div>
          ),
        )}
      </div>
      {workflows ? <div className="mt-8 w-full">{workflows}</div> : null}
      {!onPromptClick ? (
        <p className={`mt-4 ${chipSky}`}>
          Select a conversation from the sidebar to use these prompts
        </p>
      ) : null}
    </div>
  );
}
