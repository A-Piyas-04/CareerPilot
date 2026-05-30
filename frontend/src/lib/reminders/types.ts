export type AiNudgeType =
  | "application"
  | "task"
  | "deadline"
  | "roadmap"
  | "general";

export type AiNudgeActionHref =
  | "/jobs"
  | "/tracker"
  | "/goals"
  | "/calendar"
  | "/roadmap"
  | "/dashboard";

export type AiNudge = {
  id: string;
  type: AiNudgeType;
  title: string;
  message: string;
  actionLabel: string;
  actionHref: AiNudgeActionHref;
};

export type AiNudgeResponse = {
  nudges: AiNudge[];
  generatedAt: string;
  cached: boolean;
};

export type AiNudgeErrorCode = "quota_exceeded" | "nudge_generation_failed";

export type AiNudgeErrorResponse = {
  error: AiNudgeErrorCode;
  message: string;
};

export type NudgeActivitySummary = {
  totalApplications: number;
  activeApplications: number;
  savedApplications: number;
  daysSinceLastApplication: number | null;
  overdueTasks: number;
  tasksDueToday: number;
  tasksCompletedThisWeek: number;
  upcomingEventsNext7Days: Array<{
    title: string;
    eventType: string;
    startTime: string;
  }>;
  roadmapProgressAverage: number | null;
  lowProgressRoadmaps: number | null;
  openRoadmapItems: number | null;
  recentlyCompletedRoadmapItems: number | null;
  activeGoals: number | null;
  goalsNearTargetDate: number | null;
  highFitUnsavedMatches: number;
  topMatchTitles: string[];
  recentSearchQuery: string | null;
};

export const QUOTA_EXCEEDED_MESSAGE =
  "AI nudges are unavailable because the AI quota limit was exceeded. Please check your API billing or try again later.";

export const NUDGE_GENERATION_FAILED_MESSAGE =
  "Could not generate AI nudges right now. Please try again later.";

export const ALLOWED_NUDGE_TYPES: AiNudgeType[] = [
  "application",
  "task",
  "deadline",
  "roadmap",
  "general",
];

export const ALLOWED_ACTION_HREFS: AiNudgeActionHref[] = [
  "/jobs",
  "/tracker",
  "/goals",
  "/calendar",
  "/roadmap",
  "/dashboard",
];
