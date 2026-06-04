"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";

import { ApplicationCard } from "./application-card";
import type { Application, ApplicationStatus } from "./types";
import { STATUS_LABELS } from "./types";

const COLUMN_STYLES: Record<
  ApplicationStatus,
  { shell: string; header: string; dragOver: string }
> = {
  saved: {
    shell: "border-violet-200/80 bg-violet-50/30 dark:border-violet-300/35 dark:bg-violet-400/12",
    header: "border-violet-200/60 bg-gradient-to-r from-violet-50 to-purple-50/50 text-violet-900 dark:border-violet-300/30 dark:from-violet-500/28 dark:to-purple-500/18 dark:text-violet-50",
    dragOver: "bg-violet-100/60 dark:bg-violet-400/18",
  },
  applied: {
    shell: "border-sky-200/80 bg-sky-50/25 dark:border-sky-300/35 dark:bg-sky-400/12",
    header: "border-sky-200/60 bg-gradient-to-r from-sky-50 to-cyan-50/50 text-sky-900 dark:border-sky-300/30 dark:from-sky-500/28 dark:to-cyan-500/18 dark:text-sky-50",
    dragOver: "bg-sky-100/60 dark:bg-sky-400/18",
  },
  interviewing: {
    shell: "border-emerald-200/80 bg-emerald-50/25 dark:border-emerald-300/35 dark:bg-emerald-400/12",
    header: "border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-teal-50/50 text-emerald-900 dark:border-emerald-300/30 dark:from-emerald-500/28 dark:to-teal-500/18 dark:text-emerald-50",
    dragOver: "bg-emerald-100/60 dark:bg-emerald-400/18",
  },
  offer: {
    shell: "border-violet-300/80 bg-violet-50/40 dark:border-violet-300/40 dark:bg-violet-500/16",
    header: "border-violet-300/60 bg-gradient-to-r from-violet-100 to-purple-100/50 text-violet-950 dark:border-violet-300/35 dark:from-violet-400/32 dark:to-purple-400/20 dark:text-violet-50",
    dragOver: "bg-violet-100/70 dark:bg-violet-400/20",
  },
  rejected: {
    shell: "border-zinc-200/80 bg-zinc-50/50 dark:border-slate-400/35 dark:bg-slate-500/12",
    header: "border-zinc-200 bg-gradient-to-r from-zinc-100 to-zinc-50 text-zinc-700 dark:border-slate-400/30 dark:from-slate-500/30 dark:to-slate-400/18 dark:text-slate-50",
    dragOver: "bg-zinc-100/80 dark:bg-slate-400/16",
  },
};

type Props = {
  status: ApplicationStatus;
  applications: Application[];
  onOpenApplication: (application: Application) => void;
};

export function KanbanColumn({
  status,
  applications,
  onOpenApplication,
}: Props) {
  const styles = COLUMN_STYLES[status];

  return (
    <section
      className={`flex h-[calc(100vh-170px)] min-h-[520px] min-w-[16rem] flex-col overflow-hidden rounded-2xl border shadow-sm ring-1 ring-zinc-950/[0.03] lg:min-w-0 lg:w-full dark:ring-white/[0.05] ${styles.shell}`}
    >
      <header
        className={`flex h-14 items-center justify-between gap-2 border-b px-3 ${styles.header}`}
      >
        <h2 className="min-w-0 truncate text-sm font-semibold">{STATUS_LABELS[status]}</h2>
        <span className="shrink-0 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-zinc-700 ring-1 ring-zinc-200/60 dark:bg-slate-950/45 dark:text-slate-50 dark:ring-white/20">
          {applications.length}
        </span>
      </header>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-3 overflow-y-auto p-3 transition ${
              snapshot.isDraggingOver ? styles.dragOver : ""
            }`}
          >
            {applications.length === 0 ? (
              <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-zinc-300/80 bg-white/70 px-4 text-center text-sm text-zinc-500 dark:border-white/30 dark:bg-slate-950/25 dark:text-slate-200">
                No applications here yet
              </div>
            ) : null}

            {applications.map((application, index) => (
              <Draggable
                key={String(application.id)}
                draggableId={String(application.id)}
                index={index}
                disableInteractiveElementBlocking
              >
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className={dragSnapshot.isDragging ? "opacity-90" : ""}
                  >
                    <ApplicationCard
                      application={application}
                      onOpen={onOpenApplication}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </section>
  );
}
