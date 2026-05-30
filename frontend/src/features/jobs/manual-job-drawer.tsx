"use client";

import { FileText, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { SpinnerButton } from "@/components/ui";

import { useAddManualJob } from "./hooks";

type Props = {
  open: boolean;
  resumeId: string | null;
  onClose: () => void;
  onSuccess: (searchId: string, match: import("./types").MatchSummary) => void;
};

export function ManualJobDrawer({ open, resumeId, onClose, onSuccess }: Props) {
  const addManual = useAddManualJob();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [description, setDescription] = useState("");

  if (!open) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resumeId) {
      toast.error("Pick a processed CV first.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      toast.error("Title and job description are required.");
      return;
    }

    addManual.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        company: company.trim() || undefined,
        location: location.trim() || undefined,
        source_url: sourceUrl.trim() || undefined,
        resume_id: resumeId,
      },
      {
        onSuccess: (match) => {
          toast.success("Job scored against your CV.");
          onSuccess("", match);
          onClose();
          setTitle("");
          setCompany("");
          setLocation("");
          setSourceUrl("");
          setDescription("");
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-zinc-950/30">
      <aside className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 px-5">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-700" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Paste a posting
              </p>
              <h2 className="text-lg font-semibold text-zinc-950">Score a job manually</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <p className="text-sm text-zinc-600">
              Paste a job description to get the same fit score, skill gaps, and tracker
              save flow as live search results.
            </p>
            <Field label="Job title" required>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="ML Engineer Intern"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company">
                <input
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </Field>
              <Field label="Location">
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </Field>
            </div>
            <Field label="Posting URL">
              <input
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="https://..."
              />
            </Field>
            <Field label="Job description" required>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-48 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="Paste the full job description here…"
                required
              />
            </Field>
          </div>
          <footer className="border-t border-zinc-200 p-5">
            <SpinnerButton
              type="submit"
              variant="emerald"
              loading={addManual.isPending}
              loadingLabel="Scoring…"
              className="w-full"
            >
              Score against my CV
            </SpinnerButton>
          </footer>
        </form>
      </aside>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-800">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
