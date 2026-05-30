"use client";

import { FormEvent, useState } from "react";

import { SpinnerButton } from "@/components/ui";

import type {
  CreateGoalTaskInput,
  Task,
  TaskPriority,
  TaskStatus,
} from "./types";
import { PRIORITY_LABELS, TASK_STATUS_LABELS, TASK_STATUSES } from "./types";

type Props = {
  initialTask?: Task;
  submitLabel: string;
  isPending?: boolean;
  errorMessage?: string;
  includeStatus?: boolean;
  resetOnSuccess?: boolean;
  onCancel?: () => void;
  onSubmit: (input: CreateGoalTaskInput) => Promise<void>;
};

const emptyForm = {
  title: "",
  description: "",
  priority: "2",
  due_date: "",
  status: "todo",
};

export function TaskForm({
  initialTask,
  submitLabel,
  isPending,
  errorMessage,
  includeStatus,
  resetOnSuccess,
  onCancel,
  onSubmit,
}: Props) {
  const [form, setForm] = useState({
    title: initialTask?.title ?? emptyForm.title,
    description: initialTask?.description ?? emptyForm.description,
    priority: String(initialTask?.priority ?? emptyForm.priority),
    due_date: initialTask?.due_date ?? emptyForm.due_date,
    status: initialTask?.status ?? emptyForm.status,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      title: form.title,
      description: form.description || undefined,
      priority: Number(form.priority) as TaskPriority,
      due_date: form.due_date || undefined,
      status: includeStatus ? (form.status as TaskStatus) : undefined,
    });

    if (resetOnSuccess) {
      setForm(emptyForm);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_8rem_10rem]">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Task title
          </span>
          <input
            className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
            placeholder="Practice SQL interview questions"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Priority
          </span>
          <select
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            value={form.priority}
            onChange={(event) =>
              setForm({ ...form, priority: event.target.value })
            }
          >
            {[1, 2, 3].map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority as TaskPriority]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Due date
          </span>
          <input
            className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            type="date"
            value={form.due_date}
            onChange={(event) =>
              setForm({ ...form, due_date: event.target.value })
            }
          />
        </label>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem]">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Description
          </span>
          <textarea
            className="min-h-20 w-full resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder="Add details, links, or notes"
          />
        </label>

        {includeStatus ? (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">
              Status
            </span>
            <select
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value })
              }
            >
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {TASK_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <button
            className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
        <SpinnerButton
          type="submit"
          variant="emerald"
          loading={isPending}
          loadingLabel="Saving…"
          className="h-9 px-3"
        >
          {submitLabel}
        </SpinnerButton>
      </div>
    </form>
  );
}
