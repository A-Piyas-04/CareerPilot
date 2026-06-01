"use client";

import { CalendarDays, Save, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";

import {
  Button,
  ConfirmDialog,
  DrawerSkeleton,
  IconButton,
  Input,
  SpinnerButton,
  Textarea,
} from "@/components/ui";

import {
  useApplicationDetail,
  useDeleteApplication,
  useUpdateApplication,
} from "./hooks";
import type { Application } from "./types";
import {
  formatDate,
  formatRelative,
  getApplicationTitle,
  getCompanyLine,
} from "./format";
import { STATUS_LABELS } from "./types";

type Props = {
  application: Application | null;
  onClose: () => void;
};

export function ApplicationDetailDrawer({ application, onClose }: Props) {
  const detailQuery = useApplicationDetail(application?.id ?? null);
  const detail = detailQuery.data;

  if (!application) {
    return null;
  }

  const source = detail ?? application;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
      <aside className="ml-auto flex h-full w-full max-w-xl flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-strong)]">
        <header className="flex h-16 items-center justify-between border-b border-[var(--border)] px-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              {STATUS_LABELS[application.status]}
            </p>
            <h2 className="truncate text-lg font-semibold text-[var(--foreground)]">
              {getApplicationTitle(source)}
            </h2>
          </div>
          <IconButton label="Close" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        </header>

        <div className="flex-1 overflow-y-auto">
          {detailQuery.isLoading ? (
            <DrawerSkeleton />
          ) : (
            <>
              <ApplicationDetailForm
                key={`${source.id}-${source.updated_at}`}
                application={application}
                source={source}
                onClose={onClose}
              />

              <section className="border-t border-[var(--border)] p-5">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  History
                </h3>
                {detail?.history.length ? (
                  <ol className="mt-3 space-y-3">
                    {detail.history.map((item) => (
                      <li
                        className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-sm"
                        key={item.id}
                      >
                        <p className="font-medium text-[var(--foreground)]">
                          {item.old_status
                            ? `${STATUS_LABELS[item.old_status]} to ${STATUS_LABELS[item.new_status]}`
                            : `Moved to ${STATUS_LABELS[item.new_status]}`}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {formatRelative(item.changed_at)}
                        </p>
                        {item.note ? (
                          <p className="mt-2 text-[var(--muted-foreground)]">
                            {item.note}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 rounded-2xl border border-dashed border-[var(--border-strong)] px-3 py-4 text-sm text-[var(--muted-foreground)]">
                    No status changes recorded yet
                  </p>
                )}
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function ApplicationDetailForm({
  application,
  source,
  onClose,
}: {
  application: Application;
  source: Application;
  onClose: () => void;
}) {
  const updateMutation = useUpdateApplication(application.id);
  const deleteMutation = useDeleteApplication();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({
    manual_job_title: source.manual_job_title ?? "",
    manual_company: source.manual_company ?? "",
    manual_location: source.manual_location ?? "",
    deadline: source.deadline ?? "",
    notes: source.notes ?? "",
  });

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateMutation.mutateAsync({
      manual_job_title: form.manual_job_title,
      manual_company: form.manual_company || undefined,
      manual_location: form.manual_location || undefined,
      deadline: form.deadline || undefined,
      notes: form.notes || undefined,
    });
  }

  async function handleDelete() {
    await deleteMutation.mutateAsync(application.id);
    setDeleteOpen(false);
    onClose();
  }

  return (
    <>
      <form className="space-y-4 p-5" onSubmit={handleSave}>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {getCompanyLine(source)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
            <CalendarDays className="h-4 w-4" />
            Deadline: {formatDate(source.deadline)}
          </p>
        </div>

        <Field label="Job title">
          <Input
            value={form.manual_job_title}
            onChange={(event) =>
              setForm({ ...form, manual_job_title: event.target.value })
            }
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company">
            <Input
              value={form.manual_company}
              onChange={(event) =>
                setForm({ ...form, manual_company: event.target.value })
              }
            />
          </Field>

          <Field label="Location">
            <Input
              value={form.manual_location}
              onChange={(event) =>
                setForm({ ...form, manual_location: event.target.value })
              }
            />
          </Field>
        </div>

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
            className="min-h-40 resize-y"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </Field>

        {updateMutation.error || deleteMutation.error ? (
          <p className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
            {updateMutation.error?.message ?? deleteMutation.error?.message}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
          <Button
            variant="danger"
            type="button"
            onClick={() => setDeleteOpen(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>

          <SpinnerButton
            type="submit"
            variant="emerald"
            loading={updateMutation.isPending}
            loadingLabel="Saving..."
            icon={<Save className="h-4 w-4" />}
          >
            Save
          </SpinnerButton>
        </div>
      </form>

      <ConfirmDialog
        isOpen={deleteOpen}
        title="Delete application card?"
        description="This removes the application from your tracker and cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[var(--foreground)]">
        {label}
      </span>
      {children}
    </label>
  );
}
