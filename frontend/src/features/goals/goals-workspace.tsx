"use client";

import { Briefcase, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { GoalCard } from "./goal-card";
import { GoalFormDrawer } from "./goal-form-drawer";
import { useGoals } from "./hooks";
import type { GoalDetail, GoalStatus } from "./types";
import { GOAL_STATUS_LABELS, GOAL_STATUSES } from "./types";

type GoalFilter = GoalStatus | "all";

export function GoalsWorkspace() {
  const router = useRouter();
  const [filter, setFilter] = useState<GoalFilter>("active");
  const [isGoalDrawerOpen, setIsGoalDrawerOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalDetail | null>(null);
  const goalsQuery = useGoals(filter === "all" ? undefined : filter);

  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data]);

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  function handleCreateGoal() {
    setEditingGoal(null);
    setIsGoalDrawerOpen(true);
  }

  function handleEditGoal(goal: GoalDetail) {
    setEditingGoal(goal);
    setIsGoalDrawerOpen(true);
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f6f7f9]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              CareerPilot
            </p>
            <h1 className="text-2xl font-semibold text-zinc-950">Goals</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              className="flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              href="/tracker"
            >
              <Briefcase className="h-4 w-4" />
              Tracker
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
              onClick={handleCreateGoal}
            >
              <Plus className="h-4 w-4" />
              Add Goal
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-5 py-5">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", ...GOAL_STATUSES] as GoalFilter[]).map((status) => (
            <button
              className={`h-9 rounded-md border px-3 text-sm font-semibold transition ${
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
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                className="h-44 animate-pulse rounded-lg bg-zinc-200"
                key={item}
              />
            ))}
          </div>
        ) : goalsQuery.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {goalsQuery.error.message}
          </div>
        ) : goals.length ? (
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onEdit={handleEditGoal} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-zinc-950">
              No goals found
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Create a goal and break it into linked tasks.
            </p>
            <button
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              type="button"
              onClick={handleCreateGoal}
            >
              <Plus className="h-4 w-4" />
              Add Goal
            </button>
          </div>
        )}
      </section>

      <GoalFormDrawer
        goal={editingGoal}
        isOpen={isGoalDrawerOpen}
        onClose={() => setIsGoalDrawerOpen(false)}
      />
    </main>
  );
}
