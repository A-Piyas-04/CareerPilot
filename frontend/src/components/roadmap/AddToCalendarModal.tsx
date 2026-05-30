"use client";

import { FormEvent, useMemo, useState } from "react";

import { SpinnerButton } from "@/components/ui";
import type { RoadmapItem } from "@/lib/roadmap/types";
import {
  btnSecondary,
  inputFieldSky,
  premiumCard,
} from "@/lib/ui-theme";

type AddToCalendarModalProps = {
  isOpen: boolean;
  isSaving: boolean;
  item: RoadmapItem | null;
  onClose: () => void;
  onSubmit: (payload: { endTime?: string; startTime: string }) => void;
};

export function AddToCalendarModal({
  isOpen,
  isSaving,
  item,
  onClose,
  onSubmit,
}: AddToCalendarModalProps) {
  const defaultStart = useMemo(() => localDatetimeValue(new Date()), []);
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState("");

  if (!isOpen || !item) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!startTime || isSaving) {
      return;
    }

    onSubmit({
      endTime: endTime ? new Date(endTime).toISOString() : undefined,
      startTime: new Date(startTime).toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 px-4">
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-md p-6 ${premiumCard}`}
      >
        <h2 className="text-base font-semibold text-zinc-950">
          Add to calendar
        </h2>
        <p className="mt-1 text-sm text-zinc-600">{item.title}</p>

        <div className="mt-4 grid gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-800">
              Start date and time
            </span>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className={inputFieldSky}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-800">
              End date and time
            </span>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className={inputFieldSky}
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <SpinnerButton
            type="submit"
            variant="sky"
            loading={isSaving}
            loadingLabel="Saving…"
          >
            Add event
          </SpinnerButton>
        </div>
      </form>
    </div>
  );
}

function localDatetimeValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
