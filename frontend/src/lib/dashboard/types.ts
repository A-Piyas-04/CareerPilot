export type DashboardMetricKey =
  | "jobsApplied"
  | "activeApplications"
  | "roadmapProgress"
  | "tasksCompletedThisWeek"
  | "weeklyStreak"
  | "roadmapItemsDone";

export type DashboardMetrics = Record<DashboardMetricKey, number>;

export type PipelineStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected";

export type PipelineStatusCount = {
  status: PipelineStatus;
  label: string;
  count: number;
};

export type UpcomingDashboardEvent = {
  id: string;
  title: string;
  eventType: string;
  startTime: string;
};

export type RecentActivityItem = {
  id: string;
  type: "application" | "task" | "roadmap";
  title: string;
  description: string;
  timestamp: string;
};

export type DashboardMetricsResponse = {
  metrics: DashboardMetrics;
  pipeline: PipelineStatusCount[];
  upcomingEvents: UpcomingDashboardEvent[];
  recentActivity: RecentActivityItem[];
};

export const PIPELINE_STATUSES: PipelineStatusCount[] = [
  { status: "saved", label: "Saved", count: 0 },
  { status: "applied", label: "Applied", count: 0 },
  { status: "interviewing", label: "Interviewing", count: 0 },
  { status: "offer", label: "Offer", count: 0 },
  { status: "rejected", label: "Rejected", count: 0 },
];
