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
    <section className="flex h-[calc(100vh-170px)] min-h-[520px] w-72 shrink-0 flex-col rounded-lg border border-zinc-200 bg-zinc-100">
      <header className="flex h-14 items-center justify-between border-b border-zinc-200 px-3">
        <h2 className="text-sm font-semibold text-zinc-900">
          {STATUS_LABELS[status]}
        </h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-zinc-600">
          {applications.length}
        </span>
      </header>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-3 overflow-y-auto p-3 transition ${
              snapshot.isDraggingOver ? "bg-emerald-50" : ""
            }`}
          >
            {applications.length === 0 ? (
              <div className="flex h-28 items-center justify-center rounded-md border border-dashed border-zinc-300 bg-white px-4 text-center text-sm text-zinc-500">
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
