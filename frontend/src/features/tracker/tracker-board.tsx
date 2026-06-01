"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AddApplicationDrawer } from "./add-application-drawer";
import { ApplicationDetailDrawer } from "./application-detail-drawer";
import { Button, PageHeader, Skeleton, buttonClassName } from "@/components/ui";

import { KanbanColumn } from "./kanban-column";
import {
  trackerKeys,
  useApplications,
  useUpdateApplicationStatus,
} from "./hooks";
import type { Application, ApplicationStatus } from "./types";
import { APPLICATION_STATUSES, STATUS_LABELS } from "./types";

export function TrackerBoard() {
  const queryClient = useQueryClient();
  const applicationsQuery = useApplications();
  const statusMutation = useUpdateApplicationStatus();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<ApplicationStatus, Application[]>(
      APPLICATION_STATUSES.map((status) => [status, []]),
    );

    for (const application of applicationsQuery.data ?? []) {
      map.get(application.status)?.push(application);
    }

    return map;
  }, [applicationsQuery.data]);

  function handleDragEnd(result: DropResult) {
    const destination = result.destination;
    if (!destination) {
      return;
    }

    const sourceStatus = result.source.droppableId as ApplicationStatus;
    const nextStatus = destination.droppableId as ApplicationStatus;

    if (sourceStatus === nextStatus) {
      return;
    }

    const applications = queryClient.getQueryData<Application[]>(
      trackerKeys.applications,
    );
    const dragged = applications?.find(
      (item) => String(item.id) === result.draggableId,
    );

    if (!applications || !dragged) {
      return;
    }

    setStatusError(null);
    queryClient.setQueryData<Application[]>(
      trackerKeys.applications,
      applications.map((item) =>
        item.id === dragged.id ? { ...item, status: nextStatus } : item,
      ),
    );

    statusMutation.mutate(
      {
        applicationId: dragged.id,
        status: nextStatus,
        note: `Moved from ${STATUS_LABELS[sourceStatus]} to ${STATUS_LABELS[nextStatus]}`,
      },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData<Application[]>(
            trackerKeys.applications,
            (current) =>
              current?.map((item) =>
                item.id === updated.id ? updated : item,
              ) ?? [updated],
          );
          queryClient.invalidateQueries({
            queryKey: trackerKeys.detail(updated.id),
          });
        },
        onError: (error) => {
          queryClient.setQueryData(trackerKeys.applications, applications);
          setStatusError(error.message);
        },
      },
    );
  }

  return (
    <main className="cp-page flex min-h-screen flex-col">
      <section className="cp-container py-6">
        <PageHeader
          eyebrow="Pipeline"
          title="Application Tracker"
          description="Move opportunities through the hiring pipeline with fast drag-and-drop and a clean status history."
          actions={
            <>
            <Link
              className={buttonClassName({ variant: "secondary" })}
              href="/calendar"
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </Link>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Application
            </Button>
            </>
          }
        />
      </section>

      <section className="cp-container flex flex-1 flex-col gap-4 pb-6">
        {statusError ? (
          <p className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            {statusError}
          </p>
        ) : null}

        {applicationsQuery.isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2" aria-busy="true">
            {APPLICATION_STATUSES.map((status) => (
              <Skeleton
                className="h-[520px] w-72 shrink-0 rounded-[var(--radius-md)]"
                key={status}
              />
            ))}
          </div>
        ) : applicationsQuery.error ? (
          <div className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
            {applicationsQuery.error.message}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
              {APPLICATION_STATUSES.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  applications={grouped.get(status) ?? []}
                  onOpenApplication={setSelectedApplication}
                />
              ))}
            </div>
          </DragDropContext>
        )}
      </section>

      <AddApplicationDrawer
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
      <ApplicationDetailDrawer
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
      />
    </main>
  );
}
