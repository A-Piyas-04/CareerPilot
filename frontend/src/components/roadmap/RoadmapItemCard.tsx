"use client";

import { CalendarPlus, Check, Plus } from "lucide-react";

import type { RoadmapItem, RoadmapItemStatus } from "@/lib/roadmap/types";
import { badgeCompleted, badgeInProgress, chipSky, surfaceCard } from "@/lib/ui-theme";

type RoadmapItemCardProps = {
  isCreatingTask: boolean;
  isUpdating: boolean;
  item: RoadmapItem;
  onAddToCalendar: (item: RoadmapItem) => void;
  onCreateTask: (itemId: string) => void;
  onToggleStatus: (itemId: string, status: RoadmapItemStatus) => void;
};

const actionButtonClass =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-60";

export function RoadmapItemCard({
  isCreatingTask,
  isUpdating,
  item,
  onAddToCalendar,
  onCreateTask,
  onToggleStatus,
}: RoadmapItemCardProps) {
  const isDone = item.status === "done";

  return (
    <article className={`p-4 ${surfaceCard}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onToggleStatus(item.id, isDone ? "todo" : "done")}
          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
            isDone
              ? "border-sky-600 bg-sky-600 text-white"
              : "border-zinc-300 text-transparent hover:border-sky-400"
          } disabled:cursor-not-allowed disabled:opacity-60`}
          aria-label={isDone ? "Mark incomplete" : "Mark complete"}
        >
          <Check className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={chipSky}>Week {item.week_number}</span>
            <span className={isDone ? badgeCompleted : badgeInProgress}>
              {statusLabel(item.status)}
            </span>
          </div>

          <h3
            className={`mt-2 text-base font-semibold ${
              isDone ? "text-zinc-500 line-through" : "text-zinc-950"
            }`}
          >
            {item.title}
          </h3>
          {item.description ? (
            <p className="mt-2 text-sm leading-6 text-zinc-600">{item.description}</p>
          ) : null}

          {item.resources.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.resources.map((resource) =>
                resource.url ? (
                  <a
                    key={`${resource.name}-${resource.url}`}
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                  >
                    {resource.name}
                  </a>
                ) : (
                  <span
                    key={resource.name}
                    className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600"
                  >
                    {resource.name}
                  </span>
                ),
              )}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCreateTask(item.id)}
              disabled={isCreatingTask}
              className={actionButtonClass}
            >
              <Plus className="h-4 w-4" />
              Create Task
            </button>
            <button
              type="button"
              onClick={() => onAddToCalendar(item)}
              className={actionButtonClass}
            >
              <CalendarPlus className="h-4 w-4" />
              Add to Calendar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function statusLabel(status: RoadmapItemStatus) {
  return status.replace("_", " ");
}
