"use client";

import { SendHorizonal } from "lucide-react";
import { KeyboardEvent, useState } from "react";

import { SpinnerButton } from "@/components/ui";

type Props = {
  disabled?: boolean;
  isSending?: boolean;
  onSend: (content: string) => Promise<void>;
};

export function MessageComposer({ disabled, isSending, onSend }: Props) {
  const [content, setContent] = useState("");
  const canSend = Boolean(content.trim()) && !disabled && !isSending;

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || disabled || isSending) {
      return;
    }

    setContent("");

    try {
      await onSend(trimmed);
    } catch {
      setContent(trimmed);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void handleSend();
  }

  return (
    <div className="border-t border-zinc-200 bg-white p-4">
      <div className="mx-auto flex max-w-4xl items-end gap-3 rounded-lg border border-zinc-300 bg-white p-2 shadow-sm focus-within:border-[#1A56DB] focus-within:ring-2 focus-within:ring-blue-100">
        <textarea
          className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-zinc-950 outline-none"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "Create or select a conversation to start."
              : "Ask about your career plans..."
          }
          disabled={disabled}
          rows={1}
        />
        <SpinnerButton
          type="button"
          loading={isSending}
          onClick={handleSend}
          disabled={!canSend}
          icon={<SendHorizonal className="h-4 w-4" />}
          className="h-10 w-10 shrink-0 p-0"
          aria-label="Send message"
          title="Send message"
        >
          <span className="sr-only">Send message</span>
        </SpinnerButton>
      </div>
      <p className="mx-auto mt-2 max-w-4xl text-xs text-zinc-500">
        Enter to send, Shift+Enter for a new line. Responses stream from
        CareerPilot and are saved to this conversation.
      </p>
    </div>
  );
}
