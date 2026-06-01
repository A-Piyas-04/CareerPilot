"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";

import { ApplicationCard } from "./application-card";
import type { Application, ApplicationStatus } from "./types";
import { STATUS_LABELS } from "./types";

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
  return (
    <section className="flex h-[calc(100vh-220px)] min-h-[540px] w-[19rem] shrink-0 flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-glass)] shadow-[var(--shadow-soft)] backdrop-blur-xl">
      <header className="flex h-14 items-center justify-between border-b border-[var(--border)] px-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          {STATUS_LABELS[status]}
        </h2>
        <span className="rounded-full bg-[var(--surface-raised)] px-2 py-0.5 text-xs font-semibold text-[var(--muted-foreground)]">
          {applications.length}
        </span>
      </header>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-3 overflow-y-auto p-3 transition ${
              snapshot.isDraggingOver ? "bg-[var(--accent-soft)]" : ""
            }`}
          >
            {applications.length === 0 ? (
              <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-raised)] px-4 text-center text-sm text-[var(--muted-foreground)]">
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
