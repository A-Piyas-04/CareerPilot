export const GOAL_STATUSES = [
  "active",
  "completed",
  "paused",
  "cancelled",
] as const;

export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "done",
  "cancelled",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = 1 | 2 | 3;

export type Task = {
  id: string;
  user_id: string;
  goal_id: string | null;
  roadmap_item_id: string | null;
  application_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  target_date: string | null;
  created_at: string;
  updated_at: string;
};

export type GoalDetail = Goal & {
  tasks: Task[];
};

export type CreateGoalInput = {
  title: string;
  description?: string;
  target_date?: string;
  status?: GoalStatus;
};

export type UpdateGoalInput = Partial<CreateGoalInput>;

export type CreateGoalTaskInput = {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
  status?: TaskStatus;
};

export type UpdateTaskInput = Partial<CreateGoalTaskInput>;

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: "Active",
  completed: "Completed",
  paused: "Paused",
  cancelled: "Cancelled",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  1: "Low",
  2: "Medium",
  3: "High",
};
