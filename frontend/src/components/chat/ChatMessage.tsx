"use client";

import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

import type { AssistantMessage } from "@/lib/types/assistant";

type Props = {
  message: AssistantMessage;
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

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <article
        className={`group max-w-[78%] rounded-lg px-4 py-3 shadow-sm ${
          isUser
            ? "bg-[#1A56DB] text-white"
            : "border border-zinc-200 bg-white text-zinc-900"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-6">
            {message.content}
          </p>
        ) : (
          <div className="prose prose-sm max-w-none prose-zinc leading-6">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        <p
          className={`mt-2 text-[11px] font-medium opacity-0 transition group-hover:opacity-100 ${
            isUser ? "text-blue-100" : "text-zinc-400"
          }`}
        >
          {format(new Date(message.created_at), "MMM d, h:mm a")}
        </p>
      </article>
    </div>
  );
}
