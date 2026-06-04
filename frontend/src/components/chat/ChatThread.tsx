"use client";

import { Bot, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { useAssistantMessages, useSendAssistantMessage } from "@/lib/hooks/useAssistantMessages";
import type { AssistantConversation } from "@/lib/types/assistant";

import { ListCardSkeleton } from "@/components/ui";
import { chipSky, surfaceCardElevated } from "@/lib/ui-theme";

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

function scrollMessagesToBottom(container: HTMLDivElement | null, behavior: ScrollBehavior) {
  if (!container) {
    return;
  }
  container.scrollTo({
    top: container.scrollHeight,
    behavior,
  });
}

export function ChatThread({
  conversation,
  jobContext,
  onCreateConversation,
}: Props) {
  const messagesQuery = useAssistantMessages(conversation?.id ?? null);
  const sendMessageMutation = useSendAssistantMessage();
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    scrollMessagesToBottom(messagesScrollRef.current, "smooth");
  }, [messageContentKey, sendMessageMutation.isPending]);

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
    <section className="flex min-h-0 min-w-0 flex-1 flex-col border-[var(--cp-border)] bg-[var(--cp-card-bg)] lg:border-l">
      <div
        ref={messagesScrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[var(--cp-card-bg)] px-4 py-5 sm:px-6"
      >
        {!conversation ? (
          <EmptyThread
            title="Select or create a conversation"
            description="Choose a thread from the sidebar or start a new chat with a suggested prompt below."
            prompts={suggestedPrompts}
            onPromptClick={handlePromptClick}
            disabled={promptsDisabled}
          />
        ) : messagesQuery.isLoading ? (
          <ListCardSkeleton
            count={3}
            cardClassName="h-20 rounded-xl"
            className="mx-auto max-w-3xl space-y-4"
          />
        ) : messagesQuery.error ? (
          <p className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {messagesQuery.error.message}
          </p>
        ) : messages.length ? (
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {sendMessageMutation.isPending ? <AssistantTypingIndicator /> : null}
          </div>
        ) : (
          <EmptyThread
            title="Start your career conversation"
            description={
              jobContext
                ? "Ask about readiness, skill gaps, a roadmap, or a cover letter for the selected job posting."
                : "Ask a question now. CareerPilot uses your CV and this thread for grounded answers."
            }
            prompts={suggestedPrompts}
            onPromptClick={handlePromptClick}
            disabled={promptsDisabled}
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

function AssistantTypingIndicator() {
  return (
    <div className="flex gap-3" aria-live="polite" aria-label="Assistant is responding">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sky-700"
        aria-hidden
      >
        <Bot className="h-4 w-4" />
      </span>
      <div className="rounded-2xl rounded-tl-md border border-zinc-200/90 bg-zinc-50 px-4 py-3.5 shadow-sm">
        <p className="text-xs font-medium text-zinc-500">CareerPilot is thinking</p>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-sky-500 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-sky-500 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-sky-500 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
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
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-900/20">
        <Bot className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-xl font-semibold tracking-tight text-[var(--cp-text-primary)]">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--cp-text-muted)]">
        {description}
      </p>
      <div className="mt-6 grid w-full gap-2.5 sm:grid-cols-2">
        {prompts.map((prompt) =>
          onPromptClick ? (
            <button
              type="button"
              key={prompt}
              disabled={disabled}
              onClick={() => onPromptClick(prompt)}
              className={`${surfaceCardElevated} group rounded-xl p-3.5 text-left transition hover:border-sky-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <Sparkles className="mb-2 h-4 w-4 text-sky-600" />
              <span className="text-sm font-medium leading-snug text-[var(--cp-text-secondary)] group-hover:text-[var(--cp-text-primary)]">
                {prompt}
              </span>
            </button>
          ) : (
            <div
              className={`${surfaceCardElevated} rounded-xl p-3.5 text-left`}
              key={prompt}
            >
              <Sparkles className="mb-2 h-4 w-4 text-sky-600" />
              <span className="text-sm font-medium leading-snug text-[var(--cp-text-secondary)]">
                {prompt}
              </span>
            </div>
          ),
        )}
      </div>
      {!onPromptClick ? (
        <p className={`mt-4 ${chipSky}`}>
          Select a conversation from the sidebar to use these prompts
        </p>
      ) : null}
    </div>
  );
}
