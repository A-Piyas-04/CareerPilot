"use client";

import { Bot, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { useAssistantMessages, useSendAssistantMessage } from "@/lib/hooks/useAssistantMessages";
import type { AssistantConversation } from "@/lib/types/assistant";

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
    <section className="flex min-h-0 flex-1 flex-col bg-[#f6f7f9]">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1A56DB]">
            Conversation
          </p>
          <h2 className="truncate text-lg font-semibold text-zinc-950">
            {conversation?.title?.trim() || "No conversation selected"}
          </h2>
        </div>
        <span className="hidden rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-[#1A56DB] sm:inline-flex">
          Phase 2.2
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        {!conversation ? (
          <EmptyThread
            title="Select or create a conversation"
            description="Your saved career chats will appear here once you choose a thread from the sidebar."
          />
        ) : messagesQuery.isLoading ? (
          <div className="mx-auto max-w-4xl space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                className="h-20 animate-pulse rounded-lg bg-zinc-200"
                key={item}
              />
            ))}
          </div>
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
      <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-[#1A56DB]">
        <Bot className="h-7 w-7" />
      </span>
      <h3 className="mt-4 text-2xl font-semibold text-zinc-950">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
        {description}
      </p>
      <div className="mt-6 grid w-full gap-2 sm:grid-cols-3">
        {suggestedPrompts.map((prompt) => (
          <div
            className="rounded-lg border border-zinc-200 bg-white p-3 text-left text-sm font-medium text-zinc-700 shadow-sm"
            key={prompt}
          >
            <Sparkles className="mb-2 h-4 w-4 text-[#1A56DB]" />
            {prompt}
          </div>
        ))}
      </div>
    </div>
  );
}
