"use client";

import { Paperclip, SendHorizonal, X } from "lucide-react";
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

import { SpinnerButton } from "@/components/ui";
import type { AssistantMode } from "@/lib/types/assistant";

type Props = {
  disabled?: boolean;
  isSending?: boolean;
  mode?: AssistantMode;
  onSend: (content: string) => Promise<void>;
  onUpload?: (file: File) => Promise<void>;
};

export function MessageComposer({
  disabled,
  isSending,
  mode = "general_chat",
  onSend,
  onUpload,
}: Props) {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isInterviewMode = mode === "interview_prep";
  const canSend = Boolean(content.trim()) && !disabled && !isSending;
  const canUpload = Boolean(selectedFile) && Boolean(onUpload) && !disabled && !isSending;

  useEffect(() => {
    try {
      const draft = window.localStorage.getItem("careerpilot_chat_draft");
      if (draft?.trim()) {
        window.setTimeout(() => setContent(draft), 0);
        window.localStorage.removeItem("careerpilot_chat_draft");
      }
    } catch {
      // Ignore storage failures.
    }
  }, []);

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

  async function handleUpload() {
    if (!selectedFile || !onUpload || disabled || isSending) {
      return;
    }

    setUploadError(null);

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Could not upload the solution.",
      );
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void handleSend();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setUploadError(null);
    setSelectedFile(file);
  }

  return (
    <div className="shrink-0 border-t border-[var(--cp-border)] bg-[var(--cp-card-bg)] px-4 py-3.5 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-surface-muted)] p-2 shadow-sm transition focus-within:border-sky-300 focus-within:bg-[var(--cp-surface)] focus-within:ring-2 focus-within:ring-sky-100 dark:focus-within:ring-sky-400/20">
          {isInterviewMode ? (
            <>
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                onChange={handleFileChange}
                disabled={disabled || isSending}
              />
              <button
                type="button"
                className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--cp-text-muted)] transition hover:bg-[var(--cp-surface-hover)] hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isSending}
                title="Upload handwritten code"
                aria-label="Upload handwritten code"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </>
          ) : null}
          <textarea
            className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-[var(--cp-text-primary)] outline-none placeholder:text-[var(--cp-text-subtle)]"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? "Create or select a conversation to start."
                : isSending
                  ? "Waiting for a response..."
                  : isInterviewMode
                    ? "Answer the interview prompt or ask for the next question..."
                    : "Ask about your career plans..."
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
        {selectedFile ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-900">
            <span className="min-w-0 truncate">
              Ready to evaluate: {selectedFile.name}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="font-semibold text-sky-700 hover:text-sky-900 disabled:opacity-50"
                disabled={!canUpload}
                onClick={() => void handleUpload()}
              >
                Evaluate upload
              </button>
              <button
                type="button"
                className="rounded-md p-1 text-sky-700 hover:bg-sky-100"
                aria-label="Remove selected file"
                onClick={() => setSelectedFile(null)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : null}
        {uploadError ? (
          <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {uploadError}
          </p>
        ) : null}
        <p className="mt-2 text-center text-[11px] text-[var(--cp-text-muted)] sm:text-left">
          <kbd className="rounded border border-[var(--cp-border)] bg-[var(--cp-surface)] px-1 py-0.5 font-sans text-[10px] text-[var(--cp-text-muted)]">
            Enter
          </kbd>{" "}
          to send -{" "}
          <kbd className="rounded border border-[var(--cp-border)] bg-[var(--cp-surface)] px-1 py-0.5 font-sans text-[10px] text-[var(--cp-text-muted)]">
            Shift+Enter
          </kbd>{" "}
          for a new line
          {isInterviewMode ? " - upload after a coding problem is active" : ""}
        </p>
      </div>
    </div>
  );
}
