"use client";

import {
  formatDistanceToNowStrict,
  isSameDay,
  isThisWeek,
  isYesterday,
  parseISO,
} from "date-fns";
import { MessageSquarePlus, Trash2 } from "lucide-react";

import { ListCardSkeleton } from "@/components/ui";
import { isTemporaryAssistantConversationId } from "@/lib/hooks/useAssistantConversations";
import type { AssistantConversation } from "@/lib/types/assistant";

type Props = {
  activeConversationId: string | null;
  conversations: AssistantConversation[];
  errorMessage?: string;
  isCreating?: boolean;
  isDeleting?: boolean;
  isLoading?: boolean;
  onCreateConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onSelectConversation: (conversationId: string) => void;
};

type GroupKey = "today" | "yesterday" | "week" | "older";

const GROUP_LABELS: Record<GroupKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
  older: "Older",
};

export function ConversationSidebar({
  activeConversationId,
  conversations,
  errorMessage,
  isCreating,
  isDeleting,
  isLoading,
  onCreateConversation,
  onDeleteConversation,
  onSelectConversation,
}: Props) {
  const grouped = groupConversations(conversations);

  return (
    <aside className="flex h-full w-full flex-col border-r border-zinc-200 bg-white lg:w-80">
      <header className="border-b border-zinc-200 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1A56DB]">
            CareerPilot
          </p>
          <h1 className="text-xl font-semibold text-zinc-950">
            Career Assistant
          </h1>
        </div>

        <button
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1A56DB] px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
          type="button"
          onClick={onCreateConversation}
          disabled={isCreating}
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </button>
      </header>

      {errorMessage ? (
        <p className="m-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <ListCardSkeleton count={4} cardClassName="h-16 rounded-md" className="space-y-2" />
        ) : conversations.length ? (
          <div className="space-y-5">
            {(Object.keys(GROUP_LABELS) as GroupKey[]).map((group) =>
              grouped[group].length ? (
                <section key={group}>
                  <h2 className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-zinc-400">
                    {GROUP_LABELS[group]}
                  </h2>
                  <ul className="space-y-1">
                    {grouped[group].map((conversation) => (
                      <li key={conversation.id}>
                        <ConversationButton
                          conversation={conversation}
                          isActive={conversation.id === activeConversationId}
                          isTemporary={isTemporaryAssistantConversationId(
                            conversation.id,
                          )}
                          isDeleting={isDeleting}
                          onDeleteConversation={onDeleteConversation}
                          onSelectConversation={onSelectConversation}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null,
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
            No conversations yet. Start a new chat to save your first career
            question.
          </div>
        )}
      </div>
    </aside>
  );
}

function ConversationButton({
  conversation,
  isActive,
  isTemporary,
  isDeleting,
  onDeleteConversation,
  onSelectConversation,
}: {
  conversation: AssistantConversation;
  isActive: boolean;
  isTemporary: boolean;
  isDeleting?: boolean;
  onDeleteConversation: (conversationId: string) => void;
  onSelectConversation: (conversationId: string) => void;
}) {
  return (
    <div
      className={`group flex items-start gap-2 rounded-md border transition ${
        isActive
          ? "border-blue-200 bg-blue-50"
          : "border-transparent hover:border-zinc-200 hover:bg-zinc-50"
      }`}
    >
      <button
        className="min-w-0 flex-1 px-3 py-2 text-left"
        type="button"
        onClick={() => onSelectConversation(conversation.id)}
        disabled={isTemporary}
      >
        <span className="block truncate text-sm font-semibold text-zinc-950">
          {conversation.title?.trim() || "New conversation"}
        </span>
        <span className="mt-1 block text-xs font-medium text-zinc-500">
          {isTemporary ? "Creating..." : relativeTime(conversation.updated_at)}
        </span>
      </button>
      <button
        className="mr-2 mt-2 rounded-md p-1.5 text-zinc-400 opacity-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
        type="button"
        title="Delete conversation"
        onClick={(event) => {
          event.stopPropagation();
          onDeleteConversation(conversation.id);
        }}
        disabled={isDeleting || isTemporary}
        aria-label="Delete conversation"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function groupConversations(conversations: AssistantConversation[]) {
  const groups: Record<GroupKey, AssistantConversation[]> = {
    today: [],
    yesterday: [],
    week: [],
    older: [],
  };

  for (const conversation of conversations) {
    const updatedAt = parseISO(conversation.updated_at);

    if (isSameDay(updatedAt, new Date())) {
      groups.today.push(conversation);
    } else if (isYesterday(updatedAt)) {
      groups.yesterday.push(conversation);
    } else if (isThisWeek(updatedAt)) {
      groups.week.push(conversation);
    } else {
      groups.older.push(conversation);
    }
  }

  return groups;
}

function relativeTime(value: string) {
  return `${formatDistanceToNowStrict(parseISO(value))} ago`;
}
