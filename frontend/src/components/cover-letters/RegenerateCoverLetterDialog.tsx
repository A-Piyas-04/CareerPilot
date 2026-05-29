"use client";

type RegenerateCoverLetterDialogProps = {
  isOpen: boolean;
  isRegenerating: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function RegenerateCoverLetterDialog({
  isOpen,
  isRegenerating,
  onClose,
  onConfirm,
}: RegenerateCoverLetterDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <h2 className="text-base font-semibold text-zinc-950">
          Regenerate cover letter?
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          This creates a new saved version and keeps the current version.
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
            disabled={isRegenerating}
            onClick={onConfirm}
            className="h-9 rounded-md bg-[#1A56DB] px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-zinc-300"
          >
            {isRegenerating ? "Regenerating..." : "Regenerate"}
          </button>
        </div>
      </div>
    </div>
  );
}
