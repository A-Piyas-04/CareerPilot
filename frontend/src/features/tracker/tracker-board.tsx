"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { AddApplicationDrawer } from "./add-application-drawer";
import { ApplicationDetailDrawer } from "./application-detail-drawer";
import { Skeleton } from "@/components/ui";

import { KanbanColumn } from "./kanban-column";
import {
  trackerKeys,
  useApplications,
  useUpdateApplicationStatus,
} from "./hooks";
import type { Application, ApplicationStatus } from "./types";
import { APPLICATION_STATUSES, STATUS_LABELS } from "./types";

export function TrackerBoard() {
  const router = useRouter();
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

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

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
    <main className="flex min-h-screen flex-col bg-[#f6f7f9]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[1560px] flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              CareerPilot
            </p>
            <h1 className="text-2xl font-semibold text-zinc-950">
              Application Tracker
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              className="flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              href="/calendar"
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </Link>
            <button
              className="flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              type="button"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
            <button
              className="flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              type="button"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Application
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-[1560px] flex-1 flex-col gap-4 px-5 py-5">
        {statusError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {statusError}
          </p>
        ) : null}

        {applicationsQuery.isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2" aria-busy="true">
            {APPLICATION_STATUSES.map((status) => (
              <Skeleton
                className="h-[520px] w-72 shrink-0 rounded-lg"
                key={status}
              />
            ))}
          </div>
        ) : applicationsQuery.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {applicationsQuery.error.message}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-2">
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
