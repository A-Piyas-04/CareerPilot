"use client";

import { Plus, Target } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader, PageShell } from "@/components/layout";
import { TaskList } from "@/components/tasks/TaskList";
import { ListCardSkeleton } from "@/components/ui";
import { PAGE_RELATED_LINKS } from "@/lib/navigation-config";
import { alertError, btnPrimary, surfaceCard } from "@/lib/ui-theme";

import { GoalCard } from "./goal-card";
import { GoalFormDrawer } from "./goal-form-drawer";
import { useGoals } from "./hooks";
import type { GoalDetail, GoalStatus } from "./types";
import { GOAL_STATUS_LABELS, GOAL_STATUSES } from "./types";

type GoalFilter = GoalStatus | "all";

export function GoalsWorkspace() {
  const [filter, setFilter] = useState<GoalFilter>("active");
  const [isGoalDrawerOpen, setIsGoalDrawerOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalDetail | null>(null);
  const goalsQuery = useGoals(filter === "all" ? undefined : filter);

  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data]);

  function handleCreateGoal() {
    setEditingGoal(null);
    setIsGoalDrawerOpen(true);
  }

  function handleEditGoal(goal: GoalDetail) {
    setEditingGoal(goal);
    setIsGoalDrawerOpen(true);
  }

  return (
    <PageShell width="wide">
      <PageHeader
        icon={Target}
        title="Goals"
        description="Set career milestones, break them into tasks, and track progress alongside your applications."
        relatedLinks={PAGE_RELATED_LINKS["/goals"]}
        actions={
          <button className={btnPrimary} type="button" onClick={handleCreateGoal}>
            <Plus className="h-4 w-4" />
            Add Goal
          </button>
        }
      />

      <div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", ...GOAL_STATUSES] as GoalFilter[]).map((status) => (
              <button
                className={`h-9 rounded-lg border px-3 text-sm font-semibold transition ${
                  filter === status
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
                key={status}
                type="button"
                onClick={() => setFilter(status)}
              >
                {status === "all" ? "All" : GOAL_STATUS_LABELS[status]}
              </button>
            ))}
          </div>

          {goalsQuery.isLoading ? (
            <ListCardSkeleton count={3} cardClassName="h-44" className="space-y-3" />
          ) : goalsQuery.error ? (
            <div className={`${alertError} p-4`}>{goalsQuery.error.message}</div>
          ) : goals.length ? (
            <div className="space-y-4">
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} onEdit={handleEditGoal} />
              ))}
            </div>
          ) : (
            <div className={`${surfaceCard} border-dashed p-8 text-center`}>
              <h2 className="text-lg font-semibold text-zinc-950">
                No goals found
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Create a goal and break it into linked tasks.
              </p>
              <button
                className={`${btnPrimary} mt-4`}
                type="button"
                onClick={handleCreateGoal}
              >
                <Plus className="h-4 w-4" />
                Add Goal
              </button>
            </div>
          )}
        </div>

        <div className="min-w-0 xl:sticky xl:top-20 xl:self-start">
          <TaskList />
        </div>
      </div>

      <GoalFormDrawer
        goal={editingGoal}
        isOpen={isGoalDrawerOpen}
        onClose={() => setIsGoalDrawerOpen(false)}
      />
    </PageShell>
  );
}
