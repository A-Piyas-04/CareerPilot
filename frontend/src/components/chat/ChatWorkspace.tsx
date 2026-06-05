"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ConfirmDialog } from "@/components/ui";
import {
  isTemporaryAssistantConversationId,
  useAssistantConversations,
  useCreateAssistantConversation,
  useDeleteAssistantConversation,
  useUpdateAssistantConversation,
} from "@/lib/hooks/useAssistantConversations";
import { listMatches } from "@/features/jobs/api";
import {
  DEFAULT_INTERVIEW_SETTINGS,
  getConversationMode,
} from "@/lib/assistant/interview/context";
import type { AssistantMode } from "@/lib/types/assistant";

import { ChatThread } from "./ChatThread";
import { ConversationSidebar } from "./ConversationSidebar";

export type ActiveJobContext = {
  jobId: string;
  title: string;
  company: string | null;
};

export function ChatWorkspace() {
  const searchParams = useSearchParams();
  const jobIdParam = searchParams.get("jobId");

  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  );
  const [activeMode, setActiveMode] = useState<AssistantMode>("general_chat");
  const [jobContext, setJobContext] = useState<ActiveJobContext | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const conversationsQuery = useAssistantConversations();
  const createConversationMutation = useCreateAssistantConversation();
  const deleteConversationMutation = useDeleteAssistantConversation();
  const renameConversationMutation = useUpdateAssistantConversation();
  const conversations = useMemo(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data],
  );
  const persistedConversations = useMemo(
    () =>
      conversations.filter(
        (conversation) => !isTemporaryAssistantConversationId(conversation.id),
      ),
    [conversations],
  );
  const modeConversations = useMemo(
    () =>
      persistedConversations.filter(
        (conversation) => getConversationMode(conversation) === activeMode,
      ),
    [activeMode, persistedConversations],
  );
  const activeConversation = useMemo(
    () =>
      modeConversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ??
      modeConversations[0] ??
      null,
    [activeConversationId, modeConversations],
  );

  useEffect(() => {
    if (!jobIdParam) {
      queueMicrotask(() => setJobContext(null));
      return;
    }

    const jobId = jobIdParam;
    let cancelled = false;

    async function loadJob() {
      try {
        const matches = await listMatches({ job_id: jobId, limit: 1 });
        if (cancelled || !matches.length) return;
        const job = matches[0].job;
        setJobContext({
          jobId: job.id,
          title: job.title,
          company: job.company,
        });
      } catch {
        if (!cancelled) {
          setJobContext({ jobId, title: "Selected job", company: null });
        }
      }
    }

    void loadJob();
    return () => {
      cancelled = true;
    };
  }, [jobIdParam]);

  async function handleCreateConversation() {
    const context =
      activeMode === "interview_prep"
        ? {
            mode: activeMode,
            interview: {
              ...DEFAULT_INTERVIEW_SETTINGS,
              jobId: jobContext?.jobId,
              targetRole: jobContext?.title,
            },
          }
        : { mode: activeMode };
    const conversation = await createConversationMutation.mutateAsync({
      context,
      title:
        activeMode === "interview_prep"
          ? "New interview prep"
          : "New conversation",
    });
    setActiveConversationId(conversation.id);
  }

  function handleModeChange(mode: AssistantMode) {
    setActiveMode(mode);
    setActiveConversationId(null);
  }

  function handleDeleteConversation(conversationId: string) {
    setDeleteTargetId(conversationId);
  }

  async function confirmDeleteConversation() {
    if (!deleteTargetId) return;

    const conversationId = deleteTargetId;
    await deleteConversationMutation.mutateAsync(conversationId);
    setDeleteTargetId(null);

    if (conversationId === activeConversationId) {
      setActiveConversationId(null);
    }
  }

  async function handleRenameConversation(conversationId: string, title: string) {
    await renameConversationMutation.mutateAsync({ conversationId, title });
  }

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--cp-workspace-main)] lg:flex-row">
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        title="Delete conversation?"
        description="This will permanently remove this conversation and all of its messages."
        confirmLabel="Delete conversation"
        destructive
        isPending={deleteConversationMutation.isPending}
        onConfirm={confirmDeleteConversation}
        onCancel={() => setDeleteTargetId(null)}
      />
      <ConversationSidebar
        activeConversationId={activeConversation?.id ?? null}
        conversations={modeConversations}
        errorMessage={conversationsQuery.error?.message}
        isCreating={createConversationMutation.isPending}
        isDeleting={deleteConversationMutation.isPending}
        isRenaming={renameConversationMutation.isPending}
        isLoading={conversationsQuery.isLoading}
        mode={activeMode}
        onCreateConversation={handleCreateConversation}
        onDeleteConversation={handleDeleteConversation}
        onModeChange={handleModeChange}
        onRenameConversation={handleRenameConversation}
        onSelectConversation={setActiveConversationId}
      />
      <ChatThread
        conversation={activeConversation}
        jobContext={jobContext}
        mode={activeMode}
        onCreateConversation={handleCreateConversation}
      />
    </main>
  );
}
