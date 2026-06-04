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
    <div className="shrink-0 border-t border-zinc-200/90 bg-white px-4 py-3.5 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-2 shadow-sm transition focus-within:border-sky-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
          <textarea
            className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-zinc-950 outline-none placeholder:text-zinc-400"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? "Create or select a conversation to start."
                : isSending
                  ? "Waiting for a response…"
                  : "Ask about your career plans…"
            }
            disabled={disabled || isSending}
            rows={1}
            aria-label="Message"
          />
          <SpinnerButton
            type="button"
            variant="sky"
            loading={isSending}
            onClick={handleSend}
            disabled={!canSend}
            icon={<SendHorizonal className="h-4 w-4" />}
            className="mb-0.5 h-9 w-9 shrink-0 rounded-xl p-0 shadow-sm"
            aria-label="Send message"
            title="Send message"
          >
            <span className="sr-only">Send message</span>
          </SpinnerButton>
        </div>
        <p className="mt-2 text-center text-[11px] text-zinc-500 sm:text-left">
          <kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 font-sans text-[10px] text-zinc-600">
            Enter
          </kbd>{" "}
          to send ·{" "}
          <kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 font-sans text-[10px] text-zinc-600">
            Shift+Enter
          </kbd>{" "}
          for a new line
        </p>
      </div>
    </div>
  );
}
