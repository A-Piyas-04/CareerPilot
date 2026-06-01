"use client";

import { X } from "lucide-react";
import { FormEvent, useState } from "react";

import {
  Button,
  IconButton,
  Input,
  SpinnerButton,
  SubmissionProgress,
  Textarea,
} from "@/components/ui";

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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
      <aside className="ml-auto flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-strong)]">
        <header className="flex h-16 items-center justify-between border-b border-[var(--border)] px-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              New card
            </p>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Add application
            </h2>
          </div>
          <IconButton label="Close" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        </header>

        <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <Field label="Job title" required>
              <Input
                value={form.manual_job_title}
                onChange={(event) =>
                  setForm({ ...form, manual_job_title: event.target.value })
                }
                required
                placeholder="Frontend Intern"
              />
            </Field>

            <Field label="Company">
              <Input
                value={form.manual_company}
                onChange={(event) =>
                  setForm({ ...form, manual_company: event.target.value })
                }
                placeholder="Acme"
              />
            </Field>

            <Field label="Location">
              <Input
                value={form.manual_location}
                onChange={(event) =>
                  setForm({ ...form, manual_location: event.target.value })
                }
                placeholder="Dhaka"
              />
            </Field>

            <Field label="Deadline">
              <Input
                type="date"
                value={form.deadline}
                onChange={(event) =>
                  setForm({ ...form, deadline: event.target.value })
                }
              />
            </Field>

            <Field label="Notes">
              <Textarea
                className="min-h-36 resize-y"
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
                placeholder="Referral, contact person, prep notes..."
              />
            </Field>

            {mutation.error ? (
              <p className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                {mutation.error.message}
              </p>
            ) : null}
          </div>

          <SubmissionProgress
            isActive={mutation.isPending}
            mode="indeterminate"
            label="Adding application to tracker"
            className="mx-5 mb-3"
          />

          <footer className="flex items-center justify-end gap-3 border-t border-[var(--border)] p-5">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <SpinnerButton
              type="submit"
              variant="emerald"
              loading={mutation.isPending}
              loadingLabel="Adding..."
            >
              Add card
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
  children: React.ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[var(--foreground)]">
        {label}
        {required ? <span className="text-[var(--danger)]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
