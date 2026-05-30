"use client";

import { format, isBefore, parseISO, startOfToday } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useState } from "react";

import { ConfirmDialog } from "@/components/ui";
import type {
  StandaloneTask,
  StandaloneTaskPriority,
  StandaloneTaskStatus,
} from "@/lib/hooks/useTasks";
import {
  useDeleteStandaloneTask,
  useUpdateStandaloneTask,
} from "@/lib/hooks/useTasks";

type Props = {
  task: StandaloneTask;
  isSelected: boolean;
  onSelectionChange: (taskId: string, selected: boolean) => void;
};

export function TaskItem({ task, isSelected, onSelectionChange }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const updateMutation = useUpdateStandaloneTask();
  const deleteMutation = useDeleteStandaloneTask();

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
      <li className="rounded-md border border-zinc-200 bg-white p-3">
        <TaskEditForm task={task} onCancel={() => setIsEditing(false)} />
      </li>
    );
  }

  const isDone = task.status === "done";
  const isOverdue =
    Boolean(task.due_date) &&
    task.status !== "done" &&
    isBefore(parseISO(task.due_date!), startOfToday());

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
    <li className="group flex items-start gap-2 rounded-md border border-zinc-200 bg-white p-3 transition hover:border-zinc-300 hover:shadow-sm">
      <input
        className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 text-emerald-700 focus:ring-emerald-600"
        type="checkbox"
        checked={isSelected}
        onChange={(event) => onSelectionChange(task.id, event.target.checked)}
        aria-label={`Select ${task.title}`}
      />

      <button
        className="mt-0.5 h-6 w-6 shrink-0 rounded-full text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`break-words text-sm font-semibold ${
                isDone ? "text-zinc-400 line-through" : "text-zinc-950"
              }`}
            >
              {task.title}
            </p>

            {task.description ? (
              <p className="mt-1 break-words text-xs text-zinc-500">
                {task.description}
              </p>
            ) : null}
          </div>

          <span
            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${priorityClass(
              task.priority,
            )}`}
            title={priorityLabel(task.priority)}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`text-xs font-medium ${
              isOverdue ? "text-red-700" : "text-zinc-500"
            }`}
          >
            {formatDueDate(task.due_date)}
          </span>

          {task.goal_title ? (
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {task.goal_title}
            </span>
          ) : null}

          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
            {statusLabel(task.status)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
        <button
          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          type="button"
          onClick={() => setIsEditing(true)}
          title="Edit task"
          aria-label="Edit task"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
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

function TaskEditForm({
  task,
  onCancel,
}: {
  task: StandaloneTask;
  onCancel: () => void;
}) {
  const updateMutation = useUpdateStandaloneTask();
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? "",
    priority: String(task.priority),
    due_date: task.due_date ?? "",
    status: task.status,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateMutation.mutateAsync({
      taskId: task.id,
      input: {
        title: form.title,
        description: form.description || undefined,
        priority: Number(form.priority) as StandaloneTaskPriority,
        due_date: form.due_date || undefined,
        status: form.status as StandaloneTaskStatus,
      },
    });
    onCancel();
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-zinc-600">
          Title
        </span>
        <input
          className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          required
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-zinc-600">
          Description
        </span>
        <textarea
          className="min-h-20 w-full resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-zinc-600">
            Priority
          </span>
          <select
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            value={form.priority}
            onChange={(event) =>
              setForm({ ...form, priority: event.target.value })
            }
          >
            <option value="1">High</option>
            <option value="2">Normal</option>
            <option value="3">Low</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-zinc-600">
            Due date
          </span>
          <input
            className="h-10 w-full rounded-md border border-zinc-300 px-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            type="date"
            value={form.due_date}
            onChange={(event) =>
              setForm({ ...form, due_date: event.target.value })
            }
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-zinc-600">
            Status
          </span>
          <select
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            value={form.status}
            onChange={(event) =>
              setForm({
                ...form,
                status: event.target.value as StandaloneTaskStatus,
              })
            }
          >
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          className="flex h-9 items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          type="button"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
        <button
          className="flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-emerald-400"
          type="submit"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
      </div>
    </form>
  );
}

function formatDueDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  return format(parseISO(value), "MMM d");
}

function priorityClass(priority: StandaloneTaskPriority) {
  if (priority === 1) {
    return "bg-red-500";
  }
  if (priority === 2) {
    return "bg-zinc-500";
  }
  return "bg-zinc-300";
}

function priorityLabel(priority: StandaloneTaskPriority) {
  if (priority === 1) {
    return "High priority";
  }
  if (priority === 2) {
    return "Normal priority";
  }
  return "Low priority";
}

function statusLabel(status: StandaloneTaskStatus) {
  if (status === "in_progress") {
    return "In progress";
  }
  if (status === "done") {
    return "Done";
  }
  if (status === "cancelled") {
    return "Cancelled";
  }
  return "To do";
}
