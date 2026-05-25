"use client";

import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Pencil,
  PauseCircle,
  PlayCircle,
  Target,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { formatDate } from "./format";
import { useCancelGoal, useUpdateGoal } from "./hooks";
import { TaskList } from "./task-list";
import type { GoalDetail, GoalStatus } from "./types";
import { GOAL_STATUS_LABELS } from "./types";

type Props = {
  goal: GoalDetail;
  onEdit: (goal: GoalDetail) => void;
};

export function GoalCard({ goal, onEdit }: Props) {
  const [isExpanded, setIsExpanded] = useState(goal.status === "active");
  const updateMutation = useUpdateGoal(goal.id);
  const cancelMutation = useCancelGoal();
  const completedTasks = goal.tasks.filter((task) => task.status === "done").length;
  const totalTasks = goal.tasks.length;
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  async function handleStatusChange(status: GoalStatus) {
    await updateMutation.mutateAsync({ status });
  }

  async function handleCancel() {
    if (!confirm("Cancel this goal? Linked tasks will stay available for history.")) {
      return;
    }

    await cancelMutation.mutateAsync(goal.id);
  }

  return (
    <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={statusClass(goal.status)}>
                {GOAL_STATUS_LABELS[goal.status]}
              </span>
              <span className="flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
                <Target className="h-3.5 w-3.5" />
                {completedTasks}/{totalTasks} tasks
              </span>
            </div>

            <h2 className="mt-2 break-words text-lg font-semibold text-zinc-950">
              {goal.title}
            </h2>

            {goal.description ? (
              <p className="mt-1 break-words text-sm text-zinc-600">
                {goal.description}
              </p>
            ) : null}

            <p className="mt-3 flex items-center gap-1.5 text-sm text-zinc-500">
              <CalendarDays className="h-4 w-4" />
              Target: {formatDate(goal.target_date)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {goal.status !== "active" ? (
              <IconButton
                label="Resume goal"
                onClick={() => handleStatusChange("active")}
                disabled={updateMutation.isPending}
              >
                <PlayCircle className="h-4 w-4" />
              </IconButton>
            ) : null}
            {goal.status === "active" ? (
              <IconButton
                label="Pause goal"
                onClick={() => handleStatusChange("paused")}
                disabled={updateMutation.isPending}
              >
                <PauseCircle className="h-4 w-4" />
              </IconButton>
            ) : null}
            {goal.status !== "completed" ? (
              <IconButton
                label="Complete goal"
                onClick={() => handleStatusChange("completed")}
                disabled={updateMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4" />
              </IconButton>
            ) : null}
            {goal.status !== "cancelled" ? (
              <IconButton
                label="Cancel goal"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                danger
              >
                <XCircle className="h-4 w-4" />
              </IconButton>
            ) : null}
            <IconButton label="Edit goal" onClick={() => onEdit(goal)}>
              <Pencil className="h-4 w-4" />
            </IconButton>
            <IconButton
              label={isExpanded ? "Collapse tasks" : "Expand tasks"}
              onClick={() => setIsExpanded((value) => !value)}
            >
              <ChevronDown
                className={`h-4 w-4 transition ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </IconButton>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs font-medium text-zinc-500">
            {progress}% complete
          </p>
        </div>

        {updateMutation.error || cancelMutation.error ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {updateMutation.error?.message ?? cancelMutation.error?.message}
          </p>
        ) : null}
      </div>

      {isExpanded ? <TaskList goal={goal} /> : null}
    </article>
  );
}

function IconButton({
  children,
  danger,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-md p-2 disabled:opacity-60 ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function statusClass(status: GoalStatus) {
  const base = "rounded px-2 py-0.5 text-xs font-semibold";
  if (status === "active") {
    return `${base} bg-emerald-50 text-emerald-700`;
  }
  if (status === "completed") {
    return `${base} bg-sky-50 text-sky-700`;
  }
  if (status === "paused") {
    return `${base} bg-amber-50 text-amber-700`;
  }
  return `${base} bg-zinc-100 text-zinc-500`;
}
