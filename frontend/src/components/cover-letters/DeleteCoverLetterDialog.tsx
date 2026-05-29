"use client";

type DeleteCoverLetterDialogProps = {
  isDeleting: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteCoverLetterDialog({
  isDeleting,
  isOpen,
  onClose,
  onConfirm,
}: DeleteCoverLetterDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <h2 className="text-base font-semibold text-zinc-950">
          Delete cover letter?
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          This permanently removes the saved letter.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="h-9 rounded-md bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-zinc-300"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
