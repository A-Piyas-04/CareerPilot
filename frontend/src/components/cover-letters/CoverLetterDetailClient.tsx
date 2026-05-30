"use client";

import { format } from "date-fns";
import {
  Clipboard,
  Edit3,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { DeleteCoverLetterDialog } from "@/components/cover-letters/DeleteCoverLetterDialog";
import { RegenerateCoverLetterDialog } from "@/components/cover-letters/RegenerateCoverLetterDialog";
import { DetailPageShell } from "@/components/layout";
import { DetailPageSkeleton, SpinnerButton, SubmissionProgress } from "@/components/ui";
import { COVER_LETTER_REGENERATE_STEPS } from "@/lib/progress/cover-letter-progress";
import {
  useCoverLetterDetail,
  useDeleteCoverLetter,
  useRegenerateCoverLetter,
  useUpdateCoverLetter,
} from "@/lib/hooks/useCoverLetters";
import type { CoverLetterTone } from "@/lib/cover-letter/types";
import {
  alertError,
  btnSecondary,
  chipSky,
  inputFieldSky,
  surfaceCardMuted,
  textareaFieldSky,
} from "@/lib/ui-theme";

type CoverLetterDetailClientProps = {
  coverLetterId: string;
};

const TONES: { label: string; value: CoverLetterTone }[] = [
  { label: "Professional", value: "professional" },
  { label: "Concise", value: "concise" },
  { label: "Enthusiastic", value: "enthusiastic" },
];

const ghostActionClass = `${btnSecondary} h-9 px-3 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700`;

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
      <DetailPageShell
        backHref="/cover-letters"
        backLabel="Back to cover letters"
        title="Cover letter not found"
      >
        <p className={alertError}>{error?.message ?? "Cover letter not found."}</p>
      </DetailPageShell>
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

  const displayTitle =
    coverLetter.job_title || coverLetter.title || "Cover letter";

  return (
    <>
      <DetailPageShell
        backHref="/cover-letters"
        backLabel="Back to cover letters"
        title={isEditing ? form.jobTitle || displayTitle : displayTitle}
        description={
          isEditing
            ? form.companyName || undefined
            : coverLetter.company_name || undefined
        }
        meta={
          !isEditing ? (
            <>
              <span className={chipSky}>Version {coverLetter.version}</span>
              <span className="text-xs text-zinc-500">
                Updated{" "}
                {Number.isNaN(updatedAt.getTime())
                  ? "recently"
                  : format(updatedAt, "MMM d, yyyy")}
              </span>
            </>
          ) : undefined
        }
        actions={
          isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className={ghostActionClass}
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <SpinnerButton
                type="button"
                variant="sky"
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
              <button type="button" onClick={handleCopy} className={ghostActionClass}>
                <Clipboard className="h-4 w-4" />
                Copy
              </button>
              <button type="button" onClick={handleStartEditing} className={ghostActionClass}>
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setShowRegenerateDialog(true)}
                className={ghostActionClass}
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )
        }
      >
        <SubmissionProgress
          isActive={regenerateCoverLetter.isPending}
          mode="simulated"
          steps={[...COVER_LETTER_REGENERATE_STEPS]}
          tone="sky"
          className="mb-4"
        />

        {isEditing ? (
          <div className="grid gap-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-800">Job title</span>
                <input
                  value={form.jobTitle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      jobTitle: event.target.value,
                    }))
                  }
                  className={inputFieldSky}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-800">Company</span>
                <input
                  value={form.companyName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      companyName: event.target.value,
                    }))
                  }
                  className={inputFieldSky}
                />
              </label>
            </div>
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
                  className={inputFieldSky}
                >
                  {TONES.map((tone) => (
                    <option key={tone.value} value={tone.value}>
                      {tone.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-800">Extra notes</span>
                <input
                  value={form.extraNotes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      extraNotes: event.target.value,
                    }))
                  }
                  className={inputFieldSky}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-800">Job description</span>
              <textarea
                value={form.jobDescription}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    jobDescription: event.target.value,
                  }))
                }
                className={`min-h-32 ${textareaFieldSky}`}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-800">Cover letter</span>
              <textarea
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                className={`min-h-[460px] text-sm leading-6 ${textareaFieldSky}`}
              />
            </label>
          </div>
        ) : (
          <div
            className={`whitespace-pre-wrap p-5 text-sm leading-7 text-zinc-800 ${surfaceCardMuted}`}
          >
            {coverLetter.content}
          </div>
        )}
      </DetailPageShell>

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
    </>
  );
}
