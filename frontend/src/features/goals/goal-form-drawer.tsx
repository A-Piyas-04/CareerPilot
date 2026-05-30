"use client";

import { Save, X } from "lucide-react";
import { FormEvent, useState } from "react";
import type { ReactNode } from "react";

import { SpinnerButton } from "@/components/ui";

import { useCreateGoal, useUpdateGoal } from "./hooks";
import type { GoalDetail, GoalStatus } from "./types";
import { GOAL_STATUS_LABELS, GOAL_STATUSES } from "./types";

type Props = {
  goal: GoalDetail | null;
  isOpen: boolean;
  onClose: () => void;
};

const initialForm = {
  title: "",
  description: "",
  target_date: "",
  status: "active" as GoalStatus,
};

export function GoalFormDrawer({ goal, isOpen, onClose }: Props) {
  if (!isOpen) {
    return null;
  }

  return (
    <GoalFormDrawerContent
      key={goal?.id ?? "new-goal"}
      goal={goal}
      onClose={onClose}
    />
  );
}

function GoalFormDrawerContent({
  goal,
  onClose,
}: {
  goal: GoalDetail | null;
  onClose: () => void;
}) {
  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal(goal?.id ?? null);
  const [form, setForm] = useState({
    title: goal?.title ?? "",
    description: goal?.description ?? "",
    target_date: goal?.target_date ?? "",
    status: goal?.status ?? "active",
  });

  const isEditing = Boolean(goal);
  const mutation = isEditing ? updateMutation : createMutation;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      title: form.title,
      description: form.description || undefined,
      target_date: form.target_date || undefined,
      status: isEditing ? form.status : undefined,
    };

    if (isEditing) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
      setForm(initialForm);
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 bg-zinc-950/30">
      <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {isEditing ? "Edit goal" : "New goal"}
            </p>
            <h2 className="text-lg font-semibold text-zinc-950">
              {isEditing ? "Update goal" : "Create goal"}
            </h2>
          </div>
          <button
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <Field label="Title" required>
              <input
                className="h-11 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
                placeholder="Land a backend internship"
              />
            </Field>

            <Field label="Description">
              <textarea
                className="min-h-32 w-full resize-y rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Define the outcome, constraints, and success signal"
              />
            </Field>

            <Field label="Target date">
              <input
                className="h-11 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                type="date"
                value={form.target_date}
                onChange={(event) =>
                  setForm({ ...form, target_date: event.target.value })
                }
              />
            </Field>

            {isEditing ? (
              <Field label="Status">
                <select
                  className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as GoalStatus })
                  }
                >
                  {GOAL_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {GOAL_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}

            {mutation.error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {mutation.error.message}
              </p>
            ) : null}
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-zinc-200 p-5">
            <button
              className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <SpinnerButton
              type="submit"
              variant="emerald"
              loading={mutation.isPending}
              loadingLabel="Saving…"
              icon={<Save className="h-4 w-4" />}
            >
              Save
            </SpinnerButton>
          </footer>
        </form>
      </aside>
    </div>
  );
}

function Field({
  children,
  label,
  required,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
