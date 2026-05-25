"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

export type StandaloneTaskStatus =
  | "todo"
  | "in_progress"
  | "done"
  | "cancelled";

export type StandaloneTaskPriority = 1 | 2 | 3;

export type StandaloneTask = {
  id: string;
  user_id: string;
  goal_id: string | null;
  goal_title: string | null;
  roadmap_item_id: string | null;
  application_id: string | null;
  title: string;
  description: string | null;
  status: StandaloneTaskStatus;
  priority: StandaloneTaskPriority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateStandaloneTaskInput = {
  title: string;
  description?: string;
  priority?: StandaloneTaskPriority;
  due_date?: string;
  status?: StandaloneTaskStatus;
};

export type UpdateStandaloneTaskInput = Partial<CreateStandaloneTaskInput>;

type TaskRow = Omit<StandaloneTask, "goal_title"> & {
  goals?: { title: string | null } | { title: string | null }[] | null;
};

export const taskKeys = {
  standalone: ["tasks", "standalone"] as const,
};

export function useTasks() {
  return useQuery({
    queryKey: taskKeys.standalone,
    queryFn: fetchStandaloneTasks,
  });
}

export function useCreateStandaloneTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStandaloneTaskInput) => {
      try {
        return await createStandaloneTask(input);
      } catch (error) {
        showErrorToast(getErrorMessage(error));
        throw error;
      }
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.standalone });
      const previous = queryClient.getQueryData<StandaloneTask[]>(
        taskKeys.standalone,
      );
      const userId = await getCurrentUserId();
      const now = new Date().toISOString();
      const optimisticTask: StandaloneTask = {
        id: `temp-${crypto.randomUUID()}`,
        user_id: userId,
        goal_id: null,
        goal_title: null,
        roadmap_item_id: null,
        application_id: null,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        status: input.status ?? "todo",
        priority: input.priority ?? 2,
        due_date: input.due_date ?? null,
        completed_at: null,
        created_at: now,
        updated_at: now,
      };

      queryClient.setQueryData<StandaloneTask[]>(taskKeys.standalone, (current) =>
        [optimisticTask, ...(current ?? [])],
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(taskKeys.standalone, context?.previous ?? []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.standalone });
    },
  });
}

export function useUpdateStandaloneTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      input,
    }: {
      taskId: string;
      input: UpdateStandaloneTaskInput;
    }) => {
      try {
        return await updateStandaloneTask(taskId, input);
      } catch (error) {
        showErrorToast(getErrorMessage(error));
        throw error;
      }
    },
    onMutate: async ({ taskId, input }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.standalone });
      const previous = queryClient.getQueryData<StandaloneTask[]>(
        taskKeys.standalone,
      );
      const now = new Date().toISOString();

      queryClient.setQueryData<StandaloneTask[]>(taskKeys.standalone, (current) =>
        current?.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...input,
                description:
                  input.description === undefined
                    ? task.description
                    : input.description || null,
                due_date:
                  input.due_date === undefined ? task.due_date : input.due_date || null,
                completed_at: getOptimisticCompletedAt(
                  input.status,
                  task.completed_at,
                  now,
                ),
                updated_at: now,
              }
            : task,
        ) ?? [],
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(taskKeys.standalone, context?.previous ?? []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.standalone });
    },
  });
}

export function useDeleteStandaloneTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      try {
        await deleteStandaloneTask(taskId);
      } catch (error) {
        showErrorToast(getErrorMessage(error));
        throw error;
      }
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.standalone });
      const previous = queryClient.getQueryData<StandaloneTask[]>(
        taskKeys.standalone,
      );

      queryClient.setQueryData<StandaloneTask[]>(taskKeys.standalone, (current) =>
        current?.filter((task) => task.id !== taskId) ?? [],
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(taskKeys.standalone, context?.previous ?? []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.standalone });
    },
  });
}

export function useBulkCompleteStandaloneTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskIds: string[]) => {
      try {
        await bulkCompleteStandaloneTasks(taskIds);
      } catch (error) {
        showErrorToast(getErrorMessage(error));
        throw error;
      }
    },
    onMutate: async (taskIds) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.standalone });
      const previous = queryClient.getQueryData<StandaloneTask[]>(
        taskKeys.standalone,
      );
      const now = new Date().toISOString();
      const selected = new Set(taskIds);

      queryClient.setQueryData<StandaloneTask[]>(taskKeys.standalone, (current) =>
        current?.map((task) =>
          selected.has(task.id)
            ? { ...task, status: "done", completed_at: now, updated_at: now }
            : task,
        ) ?? [],
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(taskKeys.standalone, context?.previous ?? []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.standalone });
    },
  });
}

export function useBulkDeleteStandaloneTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskIds: string[]) => {
      try {
        await bulkDeleteStandaloneTasks(taskIds);
      } catch (error) {
        showErrorToast(getErrorMessage(error));
        throw error;
      }
    },
    onMutate: async (taskIds) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.standalone });
      const previous = queryClient.getQueryData<StandaloneTask[]>(
        taskKeys.standalone,
      );
      const selected = new Set(taskIds);

      queryClient.setQueryData<StandaloneTask[]>(taskKeys.standalone, (current) =>
        current?.filter((task) => !selected.has(task.id)) ?? [],
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(taskKeys.standalone, context?.previous ?? []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.standalone });
    },
  });
}

async function fetchStandaloneTasks() {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, goals:goal_id(title)")
    .eq("user_id", userId)
    .is("goal_id", null)
    .is("roadmap_item_id", null)
    .is("application_id", null)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: true });

  if (error) {
    showErrorToast(error.message);
    throw new Error(error.message);
  }

  return ((data ?? []) as TaskRow[]).map(normalizeTask);
}

async function createStandaloneTask(input: CreateStandaloneTaskInput) {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const trimmedTitle = input.title.trim();

  if (!trimmedTitle) {
    throw new Error("Task title is required.");
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      goal_id: null,
      roadmap_item_id: null,
      application_id: null,
      title: trimmedTitle,
      description: input.description?.trim() || null,
      status: input.status ?? "todo",
      priority: input.priority ?? 2,
      due_date: input.due_date || null,
      completed_at: input.status === "done" ? new Date().toISOString() : null,
    })
    .select("*, goals:goal_id(title)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeTask(data as TaskRow);
}

async function updateStandaloneTask(
  taskId: string,
  input: UpdateStandaloneTaskInput,
) {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const payload: Record<string, unknown> = {};

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) {
      throw new Error("Task title is required.");
    }
    payload.title = title;
  }

  if (input.description !== undefined) {
    payload.description = input.description?.trim() || null;
  }

  if (input.priority !== undefined) {
    payload.priority = input.priority;
  }

  if (input.due_date !== undefined) {
    payload.due_date = input.due_date || null;
  }

  if (input.status !== undefined) {
    payload.status = input.status;
    payload.completed_at =
      input.status === "done" ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", taskId)
    .eq("user_id", userId)
    .select("*, goals:goal_id(title)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeTask(data as TaskRow);
}

async function deleteStandaloneTask(taskId: string) {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

async function bulkCompleteStandaloneTasks(taskIds: string[]) {
  if (!taskIds.length) {
    return;
  }

  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .in("id", taskIds);

  if (error) {
    throw new Error(error.message);
  }
}

async function bulkDeleteStandaloneTasks(taskIds: string[]) {
  if (!taskIds.length) {
    return;
  }

  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("user_id", userId)
    .in("id", taskIds);

  if (error) {
    throw new Error(error.message);
  }
}

async function getCurrentUserId() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You need to sign in again.");
  }

  return user.id;
}

function normalizeTask(row: TaskRow): StandaloneTask {
  const goal = Array.isArray(row.goals) ? row.goals[0] : row.goals;

  return {
    ...row,
    goal_title: goal?.title ?? null,
  };
}

function getOptimisticCompletedAt(
  status: StandaloneTaskStatus | undefined,
  currentCompletedAt: string | null,
  now: string,
) {
  if (status === "done") {
    return now;
  }

  if (status) {
    return null;
  }

  return currentCompletedAt;
}

function showErrorToast(message: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("careerpilot-toast", {
      detail: { type: "error", message },
    }),
  );

  window.alert(message);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Task request failed.";
}
