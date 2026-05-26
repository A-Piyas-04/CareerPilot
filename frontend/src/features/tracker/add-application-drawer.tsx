"use client";

import { Loader2, X } from "lucide-react";
import { FormEvent, useState } from "react";

import { useCreateApplication } from "./hooks";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const initialForm = {
  manual_job_title: "",
  manual_company: "",
  manual_location: "",
  deadline: "",
  notes: "",
};

export function AddApplicationDrawer({ isOpen, onClose }: Props) {
  const [form, setForm] = useState(initialForm);
  const mutation = useCreateApplication();

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await mutation.mutateAsync({
      manual_job_title: form.manual_job_title,
      manual_company: form.manual_company || undefined,
      manual_location: form.manual_location || undefined,
      deadline: form.deadline || undefined,
      notes: form.notes || undefined,
    });
    setForm(initialForm);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 bg-zinc-950/30">
      <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              New card
            </p>
            <h2 className="text-lg font-semibold text-zinc-950">
              Add application
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
            <Field label="Job title" required>
              <input
                className="h-11 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                value={form.manual_job_title}
                onChange={(event) =>
                  setForm({ ...form, manual_job_title: event.target.value })
                }
                required
                placeholder="Frontend Intern"
              />
            </Field>

            <Field label="Company">
              <input
                className="h-11 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                value={form.manual_company}
                onChange={(event) =>
                  setForm({ ...form, manual_company: event.target.value })
                }
                placeholder="Acme"
              />
            </Field>

            <Field label="Location">
              <input
                className="h-11 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                value={form.manual_location}
                onChange={(event) =>
                  setForm({ ...form, manual_location: event.target.value })
                }
                placeholder="Dhaka"
              />
            </Field>

            <Field label="Deadline">
              <input
                className="h-11 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                type="date"
                value={form.deadline}
                onChange={(event) =>
                  setForm({ ...form, deadline: event.target.value })
                }
              />
            </Field>

            <Field label="Notes">
              <textarea
                className="min-h-36 w-full resize-y rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
                placeholder="Referral, contact person, prep notes..."
              />
            </Field>

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
            <button
              className="flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-400"
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Add card
            </button>
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
  children: React.ReactNode;
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
