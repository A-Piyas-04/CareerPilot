"use client";

import { format } from "date-fns";
import {
  ArrowLeft,
  Clipboard,
  Edit3,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { DeleteCoverLetterDialog } from "@/components/cover-letters/DeleteCoverLetterDialog";
import { DetailPageSkeleton, SpinnerButton, SubmissionProgress } from "@/components/ui";
import { COVER_LETTER_REGENERATE_STEPS } from "@/lib/progress/cover-letter-progress";
import { RegenerateCoverLetterDialog } from "@/components/cover-letters/RegenerateCoverLetterDialog";
import {
  useCoverLetterDetail,
  useDeleteCoverLetter,
  useRegenerateCoverLetter,
  useUpdateCoverLetter,
} from "@/lib/hooks/useCoverLetters";
import type { CoverLetterTone } from "@/lib/cover-letter/types";

type CoverLetterDetailClientProps = {
  coverLetterId: string;
};

const TONES: { label: string; value: CoverLetterTone }[] = [
  { label: "Professional", value: "professional" },
  { label: "Concise", value: "concise" },
  { label: "Enthusiastic", value: "enthusiastic" },
];

export function CoverLetterDetailClient({
  coverLetterId,
}: CoverLetterDetailClientProps) {
  const router = useRouter();
  const { data, error, isLoading } = useCoverLetterDetail(coverLetterId);
  const updateCoverLetter = useUpdateCoverLetter(coverLetterId);
  const deleteCoverLetter = useDeleteCoverLetter(coverLetterId);
  const regenerateCoverLetter = useRegenerateCoverLetter(coverLetterId);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    content: "",
    extraNotes: "",
    jobDescription: "",
    jobTitle: "",
    tone: "professional" as CoverLetterTone,
  });

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !data) {
    return (
      <main className="min-h-[calc(100vh-49px)] bg-zinc-50 px-6 py-6">
        <div className="mx-auto max-w-5xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error?.message ?? "Cover letter not found."}
        </div>
      </main>
    );
  }

  const coverLetter = data.coverLetter;
  const updatedAt = new Date(coverLetter.updated_at);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter.content);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Could not copy cover letter.");
    }
  };

  const handleSave = () => {
    updateCoverLetter.mutate(
      {
        companyName: form.companyName,
        content: form.content,
        extraNotes: form.extraNotes,
        jobDescription: form.jobDescription,
        jobTitle: form.jobTitle,
        tone: form.tone,
      },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  };

  const handleStartEditing = () => {
    setForm({
      companyName: coverLetter.company_name ?? "",
      content: coverLetter.content,
      extraNotes: coverLetter.extra_notes ?? "",
      jobDescription: coverLetter.job_description ?? "",
      jobTitle: coverLetter.job_title ?? coverLetter.title ?? "",
      tone: coverLetter.tone ?? "professional",
    });
    setIsEditing(true);
  };

  const handleDelete = () => {
    deleteCoverLetter.mutate(undefined, {
      onSuccess: () => router.push("/cover-letters"),
    });
  };

  const handleRegenerate = () => {
    regenerateCoverLetter.mutate(undefined, {
      onSuccess: (result) => {
        setShowRegenerateDialog(false);
        router.push(`/cover-letters/${result.coverLetter.id}`);
      },
    });
  };

  return (
    <main className="min-h-[calc(100vh-49px)] bg-zinc-50 px-6 py-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/cover-letters"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-[#1A56DB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cover letters
        </Link>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <SubmissionProgress
            isActive={regenerateCoverLetter.isPending}
            mode="simulated"
            steps={[...COVER_LETTER_REGENERATE_STEPS]}
            tone="blue"
            className="mb-4"
          />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              {isEditing ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-zinc-800">
                      Job title
                    </span>
                    <input
                      value={form.jobTitle}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          jobTitle: event.target.value,
                        }))
                      }
                      className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-zinc-800">
                      Company
                    </span>
                    <input
                      value={form.companyName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          companyName: event.target.value,
                        }))
                      }
                      className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold text-zinc-950">
                    {coverLetter.job_title || coverLetter.title || "Cover letter"}
                  </h1>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500">
                    <span>{coverLetter.company_name || "Company not set"}</span>
                    <span>Version {coverLetter.version}</span>
                    <span>
                      Updated{" "}
                      {Number.isNaN(updatedAt.getTime())
                        ? "recently"
                        : format(updatedAt, "MMM d, yyyy")}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <SpinnerButton
                    type="button"
                    loading={updateCoverLetter.isPending}
                    loadingLabel="Saving…"
                    onClick={handleSave}
                    icon={<Save className="h-4 w-4" />}
                    className="h-9 px-3"
                  >
                    Save
                  </SpinnerButton>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:border-[#1A56DB] hover:text-[#1A56DB]"
                  >
                    <Clipboard className="h-4 w-4" />
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={handleStartEditing}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:border-[#1A56DB] hover:text-[#1A56DB]"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRegenerateDialog(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:border-[#1A56DB] hover:text-[#1A56DB]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteDialog(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-red-200 px-3 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="mt-5 grid gap-4">
              <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-zinc-800">Tone</span>
                  <select
                    value={form.tone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        tone: event.target.value as CoverLetterTone,
                      }))
                    }
                    className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
                  >
                    {TONES.map((tone) => (
                      <option key={tone.value} value={tone.value}>
                        {tone.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-zinc-800">
                    Extra notes
                  </span>
                  <input
                    value={form.extraNotes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        extraNotes: event.target.value,
                      }))
                    }
                    className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-800">
                  Job description
                </span>
                <textarea
                  value={form.jobDescription}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      jobDescription: event.target.value,
                    }))
                  }
                  className="min-h-32 resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-800">
                  Cover letter
                </span>
                <textarea
                  value={form.content}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                  className="min-h-[460px] resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm leading-6 outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>
          ) : (
            <div className="mt-6 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-sm leading-7 text-zinc-800">
              {coverLetter.content}
            </div>
          )}
        </section>
      </div>

      <DeleteCoverLetterDialog
        isDeleting={deleteCoverLetter.isPending}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
      />
      <RegenerateCoverLetterDialog
        isOpen={showRegenerateDialog}
        isRegenerating={regenerateCoverLetter.isPending}
        onClose={() => setShowRegenerateDialog(false)}
        onConfirm={handleRegenerate}
      />
    </main>
  );
}
