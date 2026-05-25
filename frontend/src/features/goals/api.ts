import { apiRequest } from "@/lib/api";

import type {
  CreateGoalInput,
  CreateGoalTaskInput,
  Goal,
  GoalDetail,
  GoalStatus,
  Task,
  UpdateGoalInput,
  UpdateTaskInput,
} from "./types";

export function listGoals(statusFilter?: GoalStatus) {
  const search = statusFilter ? `?status_filter=${statusFilter}` : "";
  return apiRequest<GoalDetail[]>(`/api/v1/goals${search}`);
}

export function createGoal(input: CreateGoalInput) {
  return apiRequest<Goal>("/api/v1/goals", {
    method: "POST",
    body: input,
  });
}

export function updateGoal(goalId: string, input: UpdateGoalInput) {
  return apiRequest<Goal>(`/api/v1/goals/${goalId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteGoal(goalId: string) {
  return apiRequest<void>(`/api/v1/goals/${goalId}`, {
    method: "DELETE",
  });
}

export function createGoalTask(goalId: string, input: CreateGoalTaskInput) {
  return apiRequest<Task>(`/api/v1/goals/${goalId}/tasks`, {
    method: "POST",
    body: input,
  });
}

export function updateTask(taskId: string, input: UpdateTaskInput) {
  return apiRequest<Task>(`/api/v1/tasks/${taskId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteTask(taskId: string) {
  return apiRequest<void>(`/api/v1/tasks/${taskId}`, {
    method: "DELETE",
  });
}
