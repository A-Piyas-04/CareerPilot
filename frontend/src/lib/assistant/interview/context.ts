import type {
  AssistantConversation,
  AssistantMode,
  InterviewDifficulty,
  InterviewSettings,
  InterviewType,
} from "@/lib/types/assistant";

export const DEFAULT_INTERVIEW_SETTINGS: InterviewSettings = {
  difficulty: "medium",
  focusAreas: [],
  interviewType: "mixed",
};

export function getConversationMode(
  conversation: AssistantConversation | null | undefined,
): AssistantMode {
  return getModeFromContext(conversation?.context);
}

export function getModeFromContext(context: unknown): AssistantMode {
  if (!context || typeof context !== "object") {
    return "general_chat";
  }

  const rawMode = (context as Record<string, unknown>).mode;
  return rawMode === "interview_prep" ? "interview_prep" : "general_chat";
}

export function normalizeInterviewSettings(
  value: unknown,
  fallbackTargetRole?: string | null,
): InterviewSettings {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const focusAreas = Array.isArray(raw.focusAreas)
    ? raw.focusAreas
        .filter((area): area is string => typeof area === "string")
        .map((area) => area.trim())
        .filter(Boolean)
    : [];

  return {
    applicationId:
      typeof raw.applicationId === "string" ? raw.applicationId : undefined,
    difficulty: isInterviewDifficulty(raw.difficulty)
      ? raw.difficulty
      : DEFAULT_INTERVIEW_SETTINGS.difficulty,
    focusAreas,
    interviewType: isInterviewType(raw.interviewType)
      ? raw.interviewType
      : DEFAULT_INTERVIEW_SETTINGS.interviewType,
    jobId: typeof raw.jobId === "string" ? raw.jobId : undefined,
    targetRole:
      typeof raw.targetRole === "string" && raw.targetRole.trim()
        ? raw.targetRole.trim()
        : fallbackTargetRole?.trim() || undefined,
  };
}

export function getInterviewSettingsFromConversation(
  conversation: AssistantConversation | { context?: unknown } | null,
  fallbackTargetRole?: string | null,
) {
  const context =
    conversation?.context && typeof conversation.context === "object"
      ? conversation.context as Record<string, unknown>
      : {};

  return normalizeInterviewSettings(context.interview, fallbackTargetRole);
}

function isInterviewType(value: unknown): value is InterviewType {
  return (
    value === "behavioral" ||
    value === "technical" ||
    value === "coding" ||
    value === "mixed"
  );
}

function isInterviewDifficulty(value: unknown): value is InterviewDifficulty {
  return value === "easy" || value === "medium" || value === "hard";
}
