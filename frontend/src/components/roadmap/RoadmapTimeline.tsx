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
