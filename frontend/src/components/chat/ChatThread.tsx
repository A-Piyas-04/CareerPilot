"use client";

import { Bot, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { useAssistantMessages, useSendAssistantMessage } from "@/lib/hooks/useAssistantMessages";
import type { AssistantConversation } from "@/lib/types/assistant";

import { ListCardSkeleton } from "@/components/ui";

import { ChatMessage } from "./ChatMessage";
import { MessageComposer } from "./MessageComposer";

type Props = {
  conversation: AssistantConversation | null;
};

const suggestedPrompts = [
  "What should I focus on this week?",
  "How can I prepare for a backend internship?",
  "Help me organize my job search plan.",
];

export function ChatThread({ conversation }: Props) {
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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messageContentKey]);

  async function handleSend(content: string) {
    if (!conversation) {
      return;
    }

    await sendMessageMutation.mutateAsync({ conversation, content });
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-transparent">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface-glass)] px-5 backdrop-blur-xl">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
            Conversation
          </p>
          <h2 className="truncate text-lg font-semibold text-[var(--foreground)]">
            {conversation?.title?.trim() || "No conversation selected"}
          </h2>
        </div>
        <span className="hidden rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1 text-xs font-bold text-[var(--primary)] sm:inline-flex">
          AI workspace
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        {!conversation ? (
          <EmptyThread
            title="Select or create a conversation"
            description="Your saved career chats will appear here once you choose a thread from the sidebar."
          />
        ) : messagesQuery.isLoading ? (
          <ListCardSkeleton
            count={3}
            cardClassName="h-20 rounded-lg"
            className="mx-auto max-w-4xl space-y-4"
          />
        ) : messagesQuery.error ? (
          <p className="mx-auto max-w-4xl rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
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
            description="Ask a question now. CareerPilot will respond using the current CV context and recent conversation memory."
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
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="mx-auto flex min-h-[420px] max-w-3xl flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
        <Bot className="h-7 w-7" />
      </span>
      <h3 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
        {description}
      </p>
      <div className="mt-6 grid w-full gap-2 sm:grid-cols-3">
        {suggestedPrompts.map((prompt) => (
          <div
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-left text-sm font-medium text-[var(--foreground)] shadow-sm"
            key={prompt}
          >
            <Sparkles className="mb-2 h-4 w-4 text-[var(--primary)]" />
            {prompt}
          </div>
        ))}
      </div>
    </div>
  );
}
