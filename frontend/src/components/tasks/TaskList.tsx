"use client";

import {
  endOfWeek,
  isBefore,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfToday,
  startOfWeek,
} from "date-fns";
import { CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import type { StandaloneTask } from "@/lib/hooks/useTasks";
import {
  useBulkCompleteStandaloneTasks,
  useBulkDeleteStandaloneTasks,
  useTasks,
} from "@/lib/hooks/useTasks";

import { TaskItem } from "./TaskItem";
import { TaskQuickAdd } from "./TaskQuickAdd";

type TaskFilter = "all" | "today" | "week" | "overdue";
type GroupKey = "overdue" | "today" | "week" | "later";

const FILTERS: { key: TaskFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "overdue", label: "Overdue" },
];

const GROUP_LABELS: Record<GroupKey, string> = {
  overdue: "Overdue",
  today: "Today",
  week: "This Week",
  later: "Later",
};

export function TaskList() {
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    () => new Set(),
  );
  const tasksQuery = useTasks();
  const bulkCompleteMutation = useBulkCompleteStandaloneTasks();
  const bulkDeleteMutation = useBulkDeleteStandaloneTasks();

  const groupedTasks = useMemo(
    () => groupTasks(tasksQuery.data ?? []),
    [tasksQuery.data],
  );
  const visibleGroups = getVisibleGroups(filter);
  const selectedIds = [...selectedTaskIds];

  function handleSelectionChange(taskId: string, selected: boolean) {
    setSelectedTaskIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  }

  async function handleBulkComplete() {
    await bulkCompleteMutation.mutateAsync(selectedIds);
    setSelectedTaskIds(new Set());
  }

  async function handleBulkDelete() {
    if (!confirm("Delete selected tasks?")) {
      return;
    }

    await bulkDeleteMutation.mutateAsync(selectedIds);
    setSelectedTaskIds(new Set());
  }

  return (
    <aside
      className="flex min-h-[640px] flex-col rounded-lg border border-zinc-200 bg-white shadow-sm"
      id="tasks"
    >
      <header className="border-b border-zinc-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Tasks
            </p>
            <h2 className="text-lg font-semibold text-zinc-950">To-do List</h2>
          </div>
          {tasksQuery.isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          ) : null}
        </div>

        <div className="mt-4">
          <TaskQuickAdd />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              className={`h-8 rounded-md border px-2.5 text-xs font-semibold transition ${
                filter === item.key
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {selectedIds.length ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-800">
            {selectedIds.length} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              className="flex h-8 items-center gap-1.5 rounded-md bg-emerald-700 px-2.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:bg-emerald-400"
              type="button"
              onClick={handleBulkComplete}
              disabled={bulkCompleteMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark Complete
            </button>
            <button
              className="flex h-8 items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              type="button"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto p-4">
        {tasksQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                className="h-20 animate-pulse rounded-md bg-zinc-100"
                key={item}
              />
            ))}
          </div>
        ) : tasksQuery.error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {tasksQuery.error.message}
          </p>
        ) : (
          <div className="space-y-5">
            {visibleGroups.map((group) => (
              <TaskGroup
                key={group}
                title={GROUP_LABELS[group]}
                tasks={groupedTasks[group]}
                selectedTaskIds={selectedTaskIds}
                onSelectionChange={handleSelectionChange}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function TaskGroup({
  onSelectionChange,
  selectedTaskIds,
  tasks,
  title,
}: {
  onSelectionChange: (taskId: string, selected: boolean) => void;
  selectedTaskIds: Set<string>;
  tasks: StandaloneTask[];
  title: string;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-500">
          {title}
        </h3>
        <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
          {tasks.length}
        </span>
      </div>

      {tasks.length ? (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isSelected={selectedTaskIds.has(task.id)}
              onSelectionChange={onSelectionChange}
            />
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed border-zinc-300 px-3 py-4 text-sm text-zinc-500">
          No tasks here
        </p>
      )}
    </section>
  );
}

function groupTasks(tasks: StandaloneTask[]): Record<GroupKey, StandaloneTask[]> {
  const today = startOfToday();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const groups: Record<GroupKey, StandaloneTask[]> = {
    overdue: [],
    today: [],
    week: [],
    later: [],
  };

  for (const task of tasks) {
    if (!task.due_date) {
      groups.later.push(task);
      continue;
    }

    const dueDate = parseISO(task.due_date);

    if (task.status !== "done" && isBefore(dueDate, today)) {
      groups.overdue.push(task);
      continue;
    }

    if (isSameDay(dueDate, today)) {
      groups.today.push(task);
      continue;
    }

    if (isWithinInterval(dueDate, { start: weekStart, end: weekEnd })) {
      groups.week.push(task);
      continue;
    }

    groups.later.push(task);
  }

  return groups;
}

function getVisibleGroups(filter: TaskFilter): GroupKey[] {
  if (filter === "today") {
    return ["today"];
  }
  if (filter === "week") {
    return ["week"];
  }
  if (filter === "overdue") {
    return ["overdue"];
  }
  return ["overdue", "today", "week", "later"];
}
