"use client";

import {
  formatDistanceToNowStrict,
  isSameDay,
  isThisWeek,
  isYesterday,
  parseISO,
} from "date-fns";
import { MessageSquarePlus, MessageSquareText, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { TransitionLink } from "@/components/navigation/navigation-transition";
import { ListCardSkeleton, SpinnerButton } from "@/components/ui";
import {
  isTemporaryAssistantConversationId,
} from "@/lib/hooks/useAssistantConversations";
import { PAGE_RELATED_LINKS } from "@/lib/navigation-config";
import type { AssistantConversation } from "@/lib/types/assistant";
import {
  btnPrimarySky,
  iconTile,
  inputFieldSky,
  relatedLinkPill,
  surfaceCardHeader,
} from "@/lib/ui-theme";

type Props = {
  activeConversationId: string | null;
  conversations: AssistantConversation[];
  errorMessage?: string;
  isCreating?: boolean;
  isDeleting?: boolean;
  isRenaming?: boolean;
  isLoading?: boolean;
  onCreateConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, title: string) => Promise<void>;
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
  isRenaming,
  isLoading,
  onCreateConversation,
  onDeleteConversation,
  onRenameConversation,
  onSelectConversation,
}: Props) {
  const grouped = groupConversations(conversations);

  return (
    <aside className="flex h-full w-full flex-col border-r border-sky-100/80 bg-gradient-to-b from-white via-white to-sky-50/30 lg:w-80">
      <header className={`${surfaceCardHeader("sky")} space-y-4`}>
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconTile("sky")}`}
          >
            <MessageSquareText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              AI Assistant
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-950">
              Career Assistant
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              CV-grounded career guidance
            </p>
          </div>
        </div>

        <button
          className={`${btnPrimarySky} h-10 w-full shadow-sm`}
          type="button"
          onClick={onCreateConversation}
          disabled={isCreating}
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </button>

        <nav
          aria-label="Related pages"
          className="flex flex-wrap gap-1.5"
        >
          {PAGE_RELATED_LINKS["/chat"].map((link) => (
            <TransitionLink
              key={link.href}
              href={link.href}
              className={relatedLinkPill("sky")}
            >
              {link.label}
            </TransitionLink>
          ))}
        </nav>
      </header>

      {errorMessage ? (
        <p className="m-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
                  <h2 className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-sky-600/80">
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
                          isRenaming={isRenaming}
                          onDeleteConversation={onDeleteConversation}
                          onRenameConversation={onRenameConversation}
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
          <div className="rounded-xl border border-dashed border-sky-200/80 bg-sky-50/40 p-4 text-sm text-sky-900/70">
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
  isRenaming,
  onDeleteConversation,
  onRenameConversation,
  onSelectConversation,
}: {
  conversation: AssistantConversation;
  isActive: boolean;
  isTemporary: boolean;
  isDeleting?: boolean;
  isRenaming?: boolean;
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, title: string) => Promise<void>;
  onSelectConversation: (conversationId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conversation.title ?? "");

  async function handleSaveRename() {
    const trimmed = draftTitle.trim();
    if (!trimmed) {
      toast.error("Title cannot be empty.");
      return;
    }
    if (trimmed.length > 80) {
      toast.error("Title must be 80 characters or fewer.");
      return;
    }
    if (trimmed === (conversation.title?.trim() || "New conversation")) {
      setIsEditing(false);
      return;
    }

    try {
      await onRenameConversation(conversation.id, trimmed);
      setIsEditing(false);
      toast.success("Conversation renamed.");
    } catch {
      // Error toast handled by mutation hook
    }
  }

  if (isEditing) {
    return (
      <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50/60 p-2 shadow-sm ring-1 ring-sky-100">
        <input
          className={`${inputFieldSky} text-sm`}
          value={draftTitle}
          maxLength={80}
          autoFocus
          onChange={(event) => setDraftTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleSaveRename();
            }
            if (event.key === "Escape") {
              setDraftTitle(conversation.title ?? "");
              setIsEditing(false);
            }
          }}
        />
        <div className="mt-2 flex items-center justify-end gap-1">
          <button
            type="button"
            className="rounded-md p-1.5 text-zinc-500 hover:bg-white"
            onClick={() => {
              setDraftTitle(conversation.title ?? "");
              setIsEditing(false);
            }}
            disabled={isRenaming}
            aria-label="Cancel rename"
          >
            <X className="h-4 w-4" />
          </button>
          <SpinnerButton
            type="button"
            variant="primary"
            loading={isRenaming}
            loadingLabel="Saving…"
            onClick={() => void handleSaveRename()}
            className="h-8 rounded-md px-3 text-xs"
          >
            Save
          </SpinnerButton>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex items-start gap-2 rounded-xl border transition ${
        isActive
          ? "border-sky-300/80 bg-gradient-to-r from-sky-50 via-sky-50/90 to-cyan-50/70 shadow-sm ring-1 ring-sky-200/70"
          : "border-transparent hover:border-sky-100 hover:bg-sky-50/40"
      }`}
    >
      {isActive ? (
        <span
          aria-hidden
          className="absolute bottom-2 left-0 top-2 w-1 rounded-full bg-gradient-to-b from-sky-500 to-sky-700"
        />
      ) : null}
      <button
        className="min-w-0 flex-1 px-3 py-2.5 text-left"
        type="button"
        onClick={() => onSelectConversation(conversation.id)}
        disabled={isTemporary}
      >
        <span
          className={`block truncate text-sm font-semibold ${
            isActive ? "text-sky-950" : "text-zinc-950"
          }`}
        >
          {conversation.title?.trim() || "New conversation"}
        </span>
        <span
          className={`mt-1 block text-xs font-medium ${
            isActive ? "text-sky-700/80" : "text-zinc-500"
          }`}
        >
          {isTemporary ? "Creating..." : relativeTime(conversation.updated_at)}
        </span>
      </button>
      {!isTemporary ? (
        <button
          className="mt-2 rounded-md p-1.5 text-zinc-400 opacity-100 hover:bg-sky-100 hover:text-sky-700 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
          type="button"
          title="Rename conversation"
          onClick={(event) => {
            event.stopPropagation();
            setDraftTitle(conversation.title?.trim() || "New conversation");
            setIsEditing(true);
          }}
          disabled={isRenaming}
          aria-label="Rename conversation"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ) : null}
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
