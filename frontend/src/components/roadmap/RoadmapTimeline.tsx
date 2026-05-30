"use client";

import { useState } from "react";

import { AddToCalendarModal } from "@/components/roadmap/AddToCalendarModal";
import { RoadmapItemCard } from "@/components/roadmap/RoadmapItemCard";
import {
  useAddRoadmapItemToCalendar,
  useCreateRoadmapTask,
  useUpdateRoadmapItemStatus,
} from "@/lib/hooks/useRoadmaps";
import type { RoadmapItem, RoadmapItemStatus } from "@/lib/roadmap/types";

type RoadmapTimelineProps = {
  items: RoadmapItem[];
  roadmapId: string;
};

export function RoadmapTimeline({ items, roadmapId }: RoadmapTimelineProps) {
  const [selectedCalendarItem, setSelectedCalendarItem] =
    useState<RoadmapItem | null>(null);
  const updateStatus = useUpdateRoadmapItemStatus(roadmapId);
  const createTask = useCreateRoadmapTask(roadmapId);
  const addToCalendar = useAddRoadmapItemToCalendar(roadmapId);

  const handleToggleStatus = (itemId: string, status: RoadmapItemStatus) => {
    updateStatus.mutate({ itemId, status });
  };

  const handleAddToCalendar = (payload: {
    endTime?: string;
    startTime: string;
  }) => {
    if (!selectedCalendarItem) {
      return;
    }

    addToCalendar.mutate(
      {
        ...payload,
        itemId: selectedCalendarItem.id,
      },
      {
        onSuccess: () => setSelectedCalendarItem(null),
      },
    );
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="h-1 w-8 rounded-full bg-gradient-to-r from-sky-600 to-cyan-500"
            aria-hidden
          />
          <h2 className="text-sm font-semibold text-zinc-900">Weekly plan</h2>
        </div>
        <div className="grid gap-3">
          {items.map((item) => (
            <RoadmapItemCard
              key={item.id}
              isCreatingTask={createTask.isPending}
              isUpdating={updateStatus.isPending}
              item={item}
              onAddToCalendar={setSelectedCalendarItem}
              onCreateTask={(itemId) => createTask.mutate(itemId)}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      </div>

      <AddToCalendarModal
        isOpen={Boolean(selectedCalendarItem)}
        isSaving={addToCalendar.isPending}
        item={selectedCalendarItem}
        onClose={() => setSelectedCalendarItem(null)}
        onSubmit={handleAddToCalendar}
      />
    </>
  );
}
