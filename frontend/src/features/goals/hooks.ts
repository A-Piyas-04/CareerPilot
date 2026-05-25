import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createGoal,
  createGoalTask,
  deleteGoal,
  deleteTask,
  listGoals,
  updateGoal,
  updateTask,
} from "./api";
import type {
  CreateGoalInput,
  CreateGoalTaskInput,
  GoalDetail,
  GoalStatus,
  Task,
  TaskStatus,
  UpdateGoalInput,
  UpdateTaskInput,
} from "./types";

export const goalKeys = {
  all: ["goals"] as const,
  list: (statusFilter?: GoalStatus) => ["goals", statusFilter ?? "all"] as const,
};

export function useGoals(statusFilter?: GoalStatus) {
  return useQuery({
    queryKey: goalKeys.list(statusFilter),
    queryFn: () => listGoals(statusFilter),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGoalInput) => createGoal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

export function useUpdateGoal(goalId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGoalInput) => updateGoal(goalId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

export function useCancelGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

export function useCreateGoalTask(goalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGoalTaskInput) => createGoalTask(goalId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      updateTask(taskId, input),
    onMutate: async ({ taskId, input }) => {
      if (!("status" in input)) {
        return;
      }

      await queryClient.cancelQueries({ queryKey: goalKeys.all });
      const snapshots = queryClient.getQueriesData<GoalDetail[]>({
        queryKey: goalKeys.all,
      });

      const nextStatus = input.status as TaskStatus | undefined;
      queryClient.setQueriesData<GoalDetail[]>({ queryKey: goalKeys.all }, (old) =>
        old?.map((goal) => ({
          ...goal,
          tasks: goal.tasks.map((task) =>
            task.id === taskId ? applyTaskStatus(task, nextStatus) : task,
          ),
        })),
      );

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      for (const [queryKey, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

function applyTaskStatus(task: Task, status: TaskStatus | undefined): Task {
  if (!status) {
    return task;
  }

  return {
    ...task,
    status,
    completed_at: status === "done" ? new Date().toISOString() : null,
  };
}
