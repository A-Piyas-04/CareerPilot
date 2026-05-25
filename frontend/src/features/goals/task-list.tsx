"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { sortTasks } from "./format";
import { useCreateGoalTask } from "./hooks";
import { TaskForm } from "./task-form";
import { TaskRow } from "./task-row";
import type { GoalDetail } from "./types";

type Props = {
  goal: GoalDetail;
};

export function TaskList({ goal }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const createMutation = useCreateGoalTask(goal.id);
  const tasks = sortTasks(goal.tasks);

  return (
    <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-950">Tasks</h3>
        <button
          className="flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          type="button"
          onClick={() => setIsAdding((value) => !value)}
        >
          <Plus className="h-4 w-4" />
          Add task
        </button>
      </div>

      {isAdding ? (
        <div className="mt-3 rounded-md border border-zinc-200 bg-white p-3">
          <TaskForm
            submitLabel="Add task"
            isPending={createMutation.isPending}
            errorMessage={createMutation.error?.message}
            onCancel={() => setIsAdding(false)}
            onSubmit={async (input) => {
              await createMutation.mutateAsync(input);
              setIsAdding(false);
            }}
          />
        </div>
      ) : null}

      {tasks.length ? (
        <ul className="mt-3 space-y-2">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-md border border-dashed border-zinc-300 bg-white px-3 py-4 text-sm text-zinc-500">
          No tasks linked to this goal yet
        </p>
      )}
    </section>
  );
}
