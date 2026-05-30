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
    shell: "border-violet-200/80 bg-violet-50/30",
    header: "border-violet-200/60 bg-gradient-to-r from-violet-50 to-purple-50/50 text-violet-900",
    dragOver: "bg-violet-100/60",
  },
  applied: {
    shell: "border-sky-200/80 bg-sky-50/25",
    header: "border-sky-200/60 bg-gradient-to-r from-sky-50 to-cyan-50/50 text-sky-900",
    dragOver: "bg-sky-100/60",
  },
  interviewing: {
    shell: "border-emerald-200/80 bg-emerald-50/25",
    header: "border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-teal-50/50 text-emerald-900",
    dragOver: "bg-emerald-100/60",
  },
  offer: {
    shell: "border-violet-300/80 bg-violet-50/40",
    header: "border-violet-300/60 bg-gradient-to-r from-violet-100 to-purple-100/50 text-violet-950",
    dragOver: "bg-violet-100/70",
  },
  rejected: {
    shell: "border-zinc-200/80 bg-zinc-50/50",
    header: "border-zinc-200 bg-gradient-to-r from-zinc-100 to-zinc-50 text-zinc-700",
    dragOver: "bg-zinc-100/80",
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
      className={`flex h-[calc(100vh-170px)] min-h-[520px] w-72 shrink-0 flex-col overflow-hidden rounded-2xl border shadow-sm ring-1 ring-zinc-950/[0.03] ${styles.shell}`}
    >
      <header
        className={`flex h-14 items-center justify-between border-b px-3 ${styles.header}`}
      >
        <h2 className="text-sm font-semibold">{STATUS_LABELS[status]}</h2>
        <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-zinc-700 ring-1 ring-zinc-200/60">
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
              <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-zinc-300/80 bg-white/70 px-4 text-center text-sm text-zinc-500">
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
