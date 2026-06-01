"use client";

import {
  formatDistanceToNowStrict,
  isSameDay,
  isThisWeek,
  isYesterday,
  parseISO,
} from "date-fns";
import { MessageSquarePlus, Trash2 } from "lucide-react";

import { Button, EmptyState, IconButton, ListCardSkeleton } from "@/components/ui";
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
    <aside className="flex h-full w-full flex-col border-r border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-xl lg:w-80">
      <header className="border-b border-[var(--border)] p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
            CareerPilot
          </p>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Career Assistant
          </h1>
        </div>

        <Button
          className="mt-4 w-full"
          onClick={onCreateConversation}
          disabled={isCreating}
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </Button>
      </header>

      {errorMessage ? (
        <p className="m-3 rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
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
                  <h2 className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
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
          <EmptyState
            className="p-4"
            title="No conversations yet"
            description="Start a new chat to save your first career question."
          />
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
      className={`group flex items-start gap-2 rounded-2xl border transition ${
        isActive
          ? "border-[var(--primary)] bg-[var(--primary-soft)]"
          : "border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-subtle)]"
      }`}
    >
      <button
        className="min-w-0 flex-1 px-3 py-2 text-left"
        type="button"
        onClick={() => onSelectConversation(conversation.id)}
        disabled={isTemporary}
      >
        <span className="block truncate text-sm font-semibold text-[var(--foreground)]">
          {conversation.title?.trim() || "New conversation"}
        </span>
        <span className="mt-1 block text-xs font-medium text-[var(--muted-foreground)]">
          {isTemporary ? "Creating..." : relativeTime(conversation.updated_at)}
        </span>
      </button>
      <IconButton
        className="mr-2 mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        label="Delete conversation"
        size="sm"
        variant="ghost"
        onClick={(event) => {
          event.stopPropagation();
          onDeleteConversation(conversation.id);
        }}
        disabled={isDeleting || isTemporary}
      >
        <Trash2 className="h-4 w-4" />
      </IconButton>
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
