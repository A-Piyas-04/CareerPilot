"use client";

import { CalendarDays, Mail, Save, Sparkles, Trash2, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { DrawerSkeleton, ConfirmDialog, SpinnerButton } from "@/components/ui";
import {
  buildChatHref,
  buildCoverLetterHref,
} from "@/features/jobs/job-actions";

import {
  useApplicationDetail,
  useDeleteApplication,
  useUpdateApplication,
} from "./hooks";
import type { Application } from "./types";
import {
  formatDate,
  formatRelative,
  getApplicationDeadline,
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
    <div className="fixed inset-0 z-40 bg-zinc-950/30">
      <aside className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 px-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {STATUS_LABELS[application.status]}
            </p>
            <h2 className="truncate text-lg font-semibold text-zinc-950">
              {getApplicationTitle(source)}
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

              {source.job_match ? (
                <JobMatchSummaryBlock
                  application={source}
                  jobMatch={source.job_match}
                />
              ) : null}

              <section className="border-t border-zinc-200 p-5">
                <h3 className="text-sm font-semibold text-zinc-950">History</h3>
                {detail?.history.length ? (
              <ol className="mt-3 space-y-3">
                {detail.history.map((item) => (
                  <li
                    className="rounded-md border border-zinc-200 bg-white p-3 text-sm"
                    key={item.id}
                  >
                    <p className="font-medium text-zinc-900">
                      {item.old_status
                        ? `${STATUS_LABELS[item.old_status]} to ${STATUS_LABELS[item.new_status]}`
                        : `Moved to ${STATUS_LABELS[item.new_status]}`}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatRelative(item.changed_at)}
                    </p>
                    {item.note ? (
                      <p className="mt-2 text-zinc-600">{item.note}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 rounded-md border border-dashed border-zinc-300 px-3 py-4 text-sm text-zinc-500">
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
  const [form, setForm] = useState({
    manual_job_title: source.manual_job_title ?? "",
    manual_company: source.manual_company ?? "",
    manual_location: source.manual_location ?? "",
    deadline: source.deadline ?? "",
    notes: source.notes ?? "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    setShowDeleteConfirm(false);
    onClose();
  }

  return (
    <>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete application?"
        description="This will permanently remove this application card from your tracker."
        confirmLabel="Delete application"
        destructive
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    <form className="space-y-4 p-5" onSubmit={handleSave}>
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
        <p className="text-sm font-medium text-zinc-900">
          {getCompanyLine(source)}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-600">
          <CalendarDays className="h-4 w-4" />
          Deadline: {formatDate(getApplicationDeadline(source))}
        </p>
      </div>

      <Field label="Job title">
        <input
          className="h-11 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          value={form.manual_job_title}
          onChange={(event) =>
            setForm({ ...form, manual_job_title: event.target.value })
          }
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company">
          <input
            className="h-11 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            value={form.manual_company}
            onChange={(event) =>
              setForm({ ...form, manual_company: event.target.value })
            }
          />
        </Field>

        <Field label="Location">
          <input
            className="h-11 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            value={form.manual_location}
            onChange={(event) =>
              setForm({ ...form, manual_location: event.target.value })
            }
          />
        </Field>
      </div>

      <Field label="Deadline">
        <input
          className="h-11 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          type="date"
          value={form.deadline}
          onChange={(event) => setForm({ ...form, deadline: event.target.value })}
        />
      </Field>

      <Field label="Notes">
        <textarea
          className="min-h-40 w-full resize-y rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
        />
      </Field>

      {updateMutation.error || deleteMutation.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {updateMutation.error?.message ?? deleteMutation.error?.message}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-4">
        <button
          className="flex h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>

        <SpinnerButton
          type="submit"
          variant="emerald"
          loading={updateMutation.isPending}
          loadingLabel="Saving…"
          icon={<Save className="h-4 w-4" />}
        >
          Save
        </SpinnerButton>
      </div>
    </form>
    </>
  );
}

function JobMatchSummaryBlock({
  application,
  jobMatch,
}: {
  application: Application;
  jobMatch: NonNullable<Application["job_match"]>;
}) {
  const fitScore =
    typeof jobMatch.fit_score === "number" ? jobMatch.fit_score.toFixed(0) : null;

  return (
    <section className="border-t border-zinc-200 p-5">
      <h3 className="text-sm font-semibold text-zinc-950">Job Hunter fit</h3>
      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        {fitScore ? (
          <p className="text-2xl font-bold text-emerald-800">{fitScore}% fit</p>
        ) : null}
        {jobMatch.explanation ? (
          <p className="mt-2 text-sm text-emerald-900">{jobMatch.explanation}</p>
        ) : null}
        {jobMatch.matched_skills.length ? (
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Matched skills
          </p>
        ) : null}
        {jobMatch.matched_skills.length ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {jobMatch.matched_skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-emerald-800"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : null}
        {jobMatch.missing_skills.length ? (
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-800">
            Gaps
          </p>
        ) : null}
        {jobMatch.missing_skills.length ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {jobMatch.missing_skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-amber-900"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/jobs"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-emerald-300 bg-white px-3 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
          >
            <Sparkles className="h-4 w-4" />
            View in Job Hunter
          </Link>
          {application.job_id ? (
            <>
              <Link
                href={buildCoverLetterHref(application.job_id)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <Mail className="h-4 w-4" />
                Draft cover letter
              </Link>
              <Link
                href={buildChatHref(application.job_id)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Ask assistant
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </section>
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
      <span className="mb-1 block text-sm font-medium text-zinc-700">
        {label}
      </span>
      {children}
    </label>
  );
}
