"use client";

import { Bot, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  useAssistantMessages,
  useEvaluateInterviewUpload,
  useSendAssistantMessage,
} from "@/lib/hooks/useAssistantMessages";
import type {
  AssistantConversation,
  AssistantMode,
  InterviewAction,
  InterviewDifficulty,
  InterviewSettings,
  InterviewType,
} from "@/lib/types/assistant";

import { ListCardSkeleton } from "@/components/ui";
import { btnPrimarySky, chipSky, inputFieldSky, surfaceCardElevated } from "@/lib/ui-theme";

import type { ActiveJobContext } from "./ChatWorkspace";
import { ChatMessage } from "./ChatMessage";
import { MessageComposer } from "./MessageComposer";

type Props = {
  conversation: AssistantConversation | null;
  jobContext?: ActiveJobContext | null;
  mode: AssistantMode;
  onCreateConversation?: () => void;
};

type PromptOption = {
  action?: InterviewAction;
  content: string;
  label: string;
};

const DEFAULT_PROMPTS: PromptOption[] = [
  { content: "What should I focus on this week?", label: "Weekly focus" },
  {
    content: "How can I prepare for a backend internship?",
    label: "Backend preparation",
  },
  {
    content: "Help me organize my job search plan.",
    label: "Job search plan",
  },
];

const INTERVIEW_PROMPTS: PromptOption[] = [
  {
    action: "start",
    content:
      "Start a mixed interview prep session for my target role. Ask one question at a time.",
    label: "Start mixed interview",
  },
  {
    action: "start",
    content:
      "Start a behavioral interview and ask me one STAR-format question.",
    label: "Behavioral practice",
  },
  {
    action: "next_question",
    content:
      "Give me a coding interview problem from the internal problem bank.",
    label: "Coding problem",
  },
  {
    action: "next_question",
    content:
      "Ask me a technical concept interview question and wait for my answer.",
    label: "Technical question",
  },
];

function buildJobPrompts(title: string): PromptOption[] {
  return [
    { content: `Am I ready for this ${title} role?`, label: "Readiness check" },
    {
      content: "What skills am I missing for this posting?",
      label: "Skill gaps",
    },
    {
      content: `Build me an 8-week plan to close my gaps for this ${title} role`,
      label: "Gap roadmap",
    },
    { content: "Draft a cover letter for this job", label: "Cover letter" },
  ];
}

function scrollMessagesToBottom(container: HTMLDivElement | null, behavior: ScrollBehavior) {
  if (!container) {
    return;
  }
  container.scrollTo({
    top: container.scrollHeight,
    behavior,
  });
}

export function ChatThread({
  conversation,
  jobContext,
  mode,
  onCreateConversation,
}: Props) {
  const messagesQuery = useAssistantMessages(conversation?.id ?? null);
  const sendMessageMutation = useSendAssistantMessage();
  const uploadMutation = useEvaluateInterviewUpload();
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const messages = useMemo(
    () => messagesQuery.data ?? [],
    [messagesQuery.data],
  );
  const messageContentKey = useMemo(
    () => messages.map((message) => `${message.id}:${message.content}`).join("|"),
    [messages],
  );

  const suggestedPrompts = useMemo(
    () => {
      if (mode === "interview_prep") {
        return INTERVIEW_PROMPTS;
      }

      return jobContext?.title ? buildJobPrompts(jobContext.title) : DEFAULT_PROMPTS;
    },
    [jobContext, mode],
  );
  const activeProblemId = useMemo(() => findLastInterviewProblemId(messages), [messages]);

  useEffect(() => {
    scrollMessagesToBottom(messagesScrollRef.current, "smooth");
  }, [messageContentKey, sendMessageMutation.isPending]);

  async function handleSend(
    content: string,
    action: InterviewAction = "answer",
    interviewSettings?: Partial<InterviewSettings>,
  ) {
    if (!conversation) {
      return;
    }

    await sendMessageMutation.mutateAsync({
      conversation,
      content,
      interviewAction: mode === "interview_prep" ? action : undefined,
      interviewSettings: mode === "interview_prep" ? interviewSettings : undefined,
      jobId: jobContext?.jobId ?? null,
      mode,
      problemId: mode === "interview_prep" ? activeProblemId : null,
    });
  }

  function handlePromptClick(prompt: PromptOption) {
    if (conversation) {
      void handleSend(prompt.content, prompt.action ?? "answer");
      return;
    }

    onCreateConversation?.();
  }

  const promptsDisabled =
    sendMessageMutation.isPending ||
    uploadMutation.isPending ||
    (!conversation && !onCreateConversation);

  async function handleUpload(file: File) {
    if (!conversation || !activeProblemId) {
      throw new Error(
        "Ask CareerPilot for a coding problem first, then upload your handwritten solution.",
      );
    }

    await uploadMutation.mutateAsync({
      conversationId: conversation.id,
      file,
      problemId: activeProblemId,
    });
  }
  const isBusy = sendMessageMutation.isPending || uploadMutation.isPending;

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col border-[var(--cp-border)] bg-[var(--cp-card-bg)] lg:border-l">
      <div
        ref={messagesScrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[var(--cp-card-bg)] px-4 py-5 sm:px-6"
      >
        {!conversation ? (
          <EmptyThread
            title="Select or create a conversation"
            description={
              mode === "interview_prep"
                ? "Choose an interview session or start a new one to practice behavioral, technical, and coding answers."
                : "Choose a thread from the sidebar or start a new chat with a suggested prompt below."
            }
            prompts={suggestedPrompts}
            onPromptClick={handlePromptClick}
            disabled={promptsDisabled}
          />
        ) : messagesQuery.isLoading ? (
          <ListCardSkeleton
            count={3}
            cardClassName="h-20 rounded-xl"
            className="mx-auto max-w-3xl space-y-4"
          />
        ) : messagesQuery.error ? (
          <p className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {messagesQuery.error.message}
          </p>
        ) : messages.length ? (
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {sendMessageMutation.isPending ? <AssistantTypingIndicator /> : null}
          </div>
        ) : mode === "interview_prep" ? (
          <InterviewEmptyThread
            disabled={promptsDisabled}
            jobContext={jobContext}
            onPromptClick={handlePromptClick}
            onStart={(settings) =>
              handleSend(
                `Start an interview prep session for ${settings.targetRole || "my target role"}. Type: ${settings.interviewType}. Difficulty: ${settings.difficulty}. Focus areas: ${settings.focusAreas.join(", ") || "general interview readiness"}. Ask one question at a time.`,
                "start",
                settings,
              )
            }
            prompts={suggestedPrompts}
          />
        ) : (
          <EmptyThread
            title="Start your career conversation"
            description={
              jobContext
                ? "Ask about readiness, skill gaps, a roadmap, or a cover letter for the selected job posting."
                : "Ask a question now. CareerPilot uses your CV and this thread for grounded answers."
            }
            prompts={suggestedPrompts}
            onPromptClick={handlePromptClick}
            disabled={promptsDisabled}
          />
        )}
      </div>

      <MessageComposer
        disabled={!conversation}
        isSending={isBusy}
        mode={mode}
        onUpload={mode === "interview_prep" ? handleUpload : undefined}
        onSend={handleSend}
      />
    </section>
  );
}

function AssistantTypingIndicator() {
  return (
    <div className="flex gap-3" aria-live="polite" aria-label="Assistant is responding">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sky-700"
        aria-hidden
      >
        <Bot className="h-4 w-4" />
      </span>
      <div className="rounded-2xl rounded-tl-md border border-zinc-200/90 bg-zinc-50 px-4 py-3.5 shadow-sm">
        <p className="text-xs font-medium text-zinc-500">CareerPilot is thinking</p>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-sky-500 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-sky-500 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-sky-500 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function InterviewEmptyThread({
  disabled,
  jobContext,
  onPromptClick,
  onStart,
  prompts,
}: {
  disabled?: boolean;
  jobContext?: ActiveJobContext | null;
  onPromptClick?: (prompt: PromptOption) => void;
  onStart: (settings: InterviewSettings) => Promise<void>;
  prompts: PromptOption[];
}) {
  const [targetRole, setTargetRole] = useState(jobContext?.title ?? "");
  const [interviewType, setInterviewType] = useState<InterviewType>("mixed");
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>("medium");
  const [focusAreas, setFocusAreas] = useState(
    "behavioral, data structures, algorithms",
  );
  const [isStarting, setIsStarting] = useState(false);

  async function handleStart() {
    setIsStarting(true);
    try {
      await onStart({
        difficulty,
        focusAreas: focusAreas
          .split(",")
          .map((area) => area.trim())
          .filter(Boolean),
        interviewType,
        jobId: jobContext?.jobId,
        targetRole: targetRole.trim() || jobContext?.title || undefined,
      });
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center py-8">
      <div className={`${surfaceCardElevated} rounded-2xl p-5`}>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-900/20">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-[var(--cp-text-primary)]">
              Set up interview prep
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--cp-text-muted)]">
              Practice one question at a time. CareerPilot will use your CV,
              optional job context, and interview settings for feedback.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cp-text-muted)]">
              Target role
            </span>
            <input
              className={inputFieldSky}
              value={targetRole}
              onChange={(event) => setTargetRole(event.target.value)}
              placeholder="ML Engineer Intern, Backend Developer, Data Engineer..."
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cp-text-muted)]">
              Interview type
            </span>
            <select
              className={inputFieldSky}
              value={interviewType}
              onChange={(event) => setInterviewType(event.target.value as InterviewType)}
            >
              <option value="mixed">Mixed</option>
              <option value="behavioral">Behavioral</option>
              <option value="technical">Technical</option>
              <option value="coding">Coding</option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cp-text-muted)]">
              Difficulty
            </span>
            <select
              className={inputFieldSky}
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value as InterviewDifficulty)
              }
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>

          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cp-text-muted)]">
              Focus areas
            </span>
            <input
              className={inputFieldSky}
              value={focusAreas}
              onChange={(event) => setFocusAreas(event.target.value)}
              placeholder="behavioral, arrays, graphs, system design..."
            />
          </label>
        </div>

        <button
          className={`${btnPrimarySky} mt-4 h-10 rounded-xl px-4 disabled:opacity-60`}
          type="button"
          disabled={disabled || isStarting}
          onClick={() => void handleStart()}
        >
          Start Practice
        </button>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {prompts.map((prompt) => (
          <button
            type="button"
            key={prompt.content}
            disabled={disabled}
            onClick={() => onPromptClick?.(prompt)}
            className={`${surfaceCardElevated} group rounded-xl p-3.5 text-left transition hover:border-sky-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Sparkles className="mb-2 h-4 w-4 text-sky-600" />
            <span className="text-sm font-medium leading-snug text-[var(--cp-text-secondary)] group-hover:text-[var(--cp-text-primary)]">
              {prompt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyThread({
  description,
  title,
  prompts,
  onPromptClick,
  disabled,
}: {
  description: string;
  title: string;
  prompts: PromptOption[];
  onPromptClick?: (prompt: PromptOption) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-900/20">
        <Bot className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-xl font-semibold tracking-tight text-[var(--cp-text-primary)]">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--cp-text-muted)]">
        {description}
      </p>
      <div className="mt-6 grid w-full gap-2.5 sm:grid-cols-2">
        {prompts.map((prompt) =>
          onPromptClick ? (
            <button
              type="button"
              key={prompt.content}
              disabled={disabled}
              onClick={() => onPromptClick(prompt)}
              className={`${surfaceCardElevated} group rounded-xl p-3.5 text-left transition hover:border-sky-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <Sparkles className="mb-2 h-4 w-4 text-sky-600" />
              <span className="text-sm font-medium leading-snug text-[var(--cp-text-secondary)] group-hover:text-[var(--cp-text-primary)]">
                {prompt.label}
              </span>
            </button>
          ) : (
            <div
              className={`${surfaceCardElevated} rounded-xl p-3.5 text-left`}
              key={prompt.content}
            >
              <Sparkles className="mb-2 h-4 w-4 text-sky-600" />
              <span className="text-sm font-medium leading-snug text-[var(--cp-text-secondary)]">
                {prompt.label}
              </span>
            </div>
          ),
        )}
      </div>
      {!onPromptClick ? (
        <p className={`mt-4 ${chipSky}`}>
          Select a conversation from the sidebar to use these prompts
        </p>
      ) : null}
    </div>
  );
}

function findLastInterviewProblemId(messages: Array<{ metadata?: Record<string, unknown> }>) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const interview = messages[index].metadata?.interview;
    if (!interview || typeof interview !== "object") {
      continue;
    }
    const problemId = (interview as Record<string, unknown>).problem_id;
    if (typeof problemId === "string" && problemId.trim()) {
      return problemId;
    }
  }

  return null;
}
