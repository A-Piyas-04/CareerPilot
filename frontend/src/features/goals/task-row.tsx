"use client";

import { CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui";

import { getDueLabel } from "./format";
import { useDeleteTask, useUpdateTask } from "./hooks";
import { TaskForm } from "./task-form";
import type { Task } from "./types";
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from "./types";

type Props = {
  task: Task;
};

export function TaskRow({ task }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  async function handleToggleDone() {
    await updateMutation.mutateAsync({
      taskId: task.id,
      input: { status: task.status === "done" ? "todo" : "done" },
    });
  }

  async function handleDelete() {
    await deleteMutation.mutateAsync(task.id);
    setShowDeleteConfirm(false);
  }

  if (isEditing) {
    return (
      <li className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
        <TaskForm
          initialTask={task}
          submitLabel="Save task"
          includeStatus
          isPending={updateMutation.isPending}
          errorMessage={updateMutation.error?.message}
          onCancel={() => setIsEditing(false)}
          onSubmit={async (input) => {
            await updateMutation.mutateAsync({ taskId: task.id, input });
            setIsEditing(false);
          }}
        />
      </li>
    );
  }

  const isDone = task.status === "done";

  return (
    <>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete this task?"
        description="This will permanently remove this task."
        confirmLabel="Delete task"
        destructive
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    <li className="flex gap-3 rounded-md border border-zinc-200 bg-white p-3">
      <button
        className="mt-0.5 h-6 w-6 shrink-0 rounded text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
        type="button"
        onClick={handleToggleDone}
        disabled={updateMutation.isPending}
        title={isDone ? "Mark as to do" : "Mark as done"}
        aria-label={isDone ? "Mark as to do" : "Mark as done"}
      >
        {isDone ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`break-words text-sm font-semibold ${
              isDone ? "text-zinc-500 line-through" : "text-zinc-950"
            }`}
          >
            {task.title}
          </p>
          <span className={statusClass(task.status)}>
            {TASK_STATUS_LABELS[task.status]}
          </span>
          <span className={priorityClass(task.priority)}>
            {PRIORITY_LABELS[task.priority]}
          </span>
        </div>

        {task.description ? (
          <p className="mt-1 break-words text-sm text-zinc-600">
            {task.description}
          </p>
        ) : null}

        <p className="mt-2 text-xs font-medium text-zinc-500">
          {getDueLabel(task.due_date)}
        </p>

        {updateMutation.error || deleteMutation.error ? (
          <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {updateMutation.error?.message ?? deleteMutation.error?.message}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-start gap-1">
        <button
          className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          type="button"
          onClick={() => setIsEditing(true)}
          title="Edit task"
          aria-label="Edit task"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          className="rounded-md p-2 text-red-600 hover:bg-red-50"
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleteMutation.isPending}
          title="Delete task"
          aria-label="Delete task"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
    </>
  );
}

function statusClass(status: Task["status"]) {
  const base = "rounded px-2 py-0.5 text-xs font-semibold";
  if (status === "done") {
    return `${base} bg-emerald-50 text-emerald-700`;
  }
  if (status === "in_progress") {
    return `${base} bg-sky-50 text-sky-700`;
  }
  if (status === "cancelled") {
    return `${base} bg-zinc-100 text-zinc-500`;
  }
  return `${base} bg-amber-50 text-amber-700`;
}

function priorityClass(priority: Task["priority"]) {
  const base = "rounded px-2 py-0.5 text-xs font-semibold";
  if (priority === 3) {
    return `${base} bg-rose-50 text-rose-700`;
  }
  if (priority === 2) {
    return `${base} bg-indigo-50 text-indigo-700`;
  }
  return `${base} bg-zinc-100 text-zinc-600`;
}
