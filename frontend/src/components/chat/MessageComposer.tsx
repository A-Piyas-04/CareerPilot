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
    <div className="shrink-0 border-t border-[var(--cp-border)] bg-[var(--cp-card-bg)] px-4 py-3.5 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-surface-muted)] p-2 shadow-sm transition focus-within:border-sky-300 focus-within:bg-[var(--cp-surface)] focus-within:ring-2 focus-within:ring-sky-100 dark:focus-within:ring-sky-400/20">
          <textarea
            className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-[var(--cp-text-primary)] outline-none placeholder:text-[var(--cp-text-subtle)]"
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
        <p className="mt-2 text-center text-[11px] text-[var(--cp-text-muted)] sm:text-left">
          <kbd className="rounded border border-[var(--cp-border)] bg-[var(--cp-surface)] px-1 py-0.5 font-sans text-[10px] text-[var(--cp-text-muted)]">
            Enter
          </kbd>{" "}
          to send ·{" "}
          <kbd className="rounded border border-[var(--cp-border)] bg-[var(--cp-surface)] px-1 py-0.5 font-sans text-[10px] text-[var(--cp-text-muted)]">
            Shift+Enter
          </kbd>{" "}
          for a new line
        </p>
      </div>
    </div>
  );
}
