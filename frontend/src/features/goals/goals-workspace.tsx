"use client";

import { Briefcase, CalendarDays, Plus, Target } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { TaskList } from "@/components/tasks/TaskList";

import {
  Button,
  EmptyState,
  ListCardSkeleton,
  PageHeader,
  Tabs,
  buttonClassName,
} from "@/components/ui";

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
    <main className="cp-page flex min-h-screen flex-col">
      <section className="cp-container py-6">
        <PageHeader
          eyebrow="Outcomes"
          icon={Target}
          title="Goals"
          description="Turn career ambitions into visible milestones, linked tasks, and weekly progress."
          actions={
            <>
            <Link
              className={buttonClassName({ variant: "secondary" })}
              href="/calendar"
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </Link>
            <Link
              className={buttonClassName({ variant: "secondary" })}
              href="/tracker"
            >
              <Briefcase className="h-4 w-4" />
              Tracker
            </Link>
            <Button onClick={handleCreateGoal}>
              <Plus className="h-4 w-4" />
              Add Goal
            </Button>
            </>
          }
        />
      </section>

      <section className="cp-container grid flex-1 gap-5 pb-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-4">
          <Tabs
            label="Goal status filter"
            value={filter}
            onChange={setFilter}
            items={(["all", ...GOAL_STATUSES] as GoalFilter[]).map((status) => ({
              value: status,
              label: status === "all" ? "All" : GOAL_STATUS_LABELS[status],
            }))}
          />

          {goalsQuery.isLoading ? (
            <ListCardSkeleton count={3} cardClassName="h-44" className="space-y-3" />
          ) : goalsQuery.error ? (
            <div className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
              {goalsQuery.error.message}
            </div>
          ) : goals.length ? (
            <div className="space-y-4">
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} onEdit={handleEditGoal} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No goals found"
              description="Create a goal and break it into linked tasks."
              action={
                <Button onClick={handleCreateGoal}>
                  <Plus className="h-4 w-4" />
                  Add Goal
                </Button>
              }
            />
          )}
        </div>

        <div className="min-w-0 xl:sticky xl:top-5 xl:self-start">
          <TaskList />
        </div>
      </section>

      <GoalFormDrawer
        goal={editingGoal}
        isOpen={isGoalDrawerOpen}
        onClose={() => setIsGoalDrawerOpen(false)}
      />
    </main>
  );
}
