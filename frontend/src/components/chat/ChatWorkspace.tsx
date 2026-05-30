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
  const activeConversation = useMemo(
    () =>
      persistedConversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ??
      persistedConversations[0] ??
      null,
    [activeConversationId, persistedConversations],
  );

  useEffect(() => {
    if (!jobIdParam) {
      setJobContext(null);
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
    const conversation = await createConversationMutation.mutateAsync({
      title: "New conversation",
    });
    setActiveConversationId(conversation.id);
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
    <main className="flex min-h-[calc(100vh-var(--cp-nav-height))] flex-col bg-[var(--cp-page-bg)] lg:flex-row">
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
        conversations={conversations}
        errorMessage={conversationsQuery.error?.message}
        isCreating={createConversationMutation.isPending}
        isDeleting={deleteConversationMutation.isPending}
        isRenaming={renameConversationMutation.isPending}
        isLoading={conversationsQuery.isLoading}
        onCreateConversation={handleCreateConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onSelectConversation={setActiveConversationId}
      />
      <ChatThread
        conversation={activeConversation}
        jobContext={jobContext}
        onCreateConversation={handleCreateConversation}
      />
    </main>
  );
}
