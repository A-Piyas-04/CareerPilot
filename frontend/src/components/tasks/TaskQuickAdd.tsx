"use client";

import { Loader2, Plus } from "lucide-react";
import { FormEvent, useState } from "react";

import { useCreateStandaloneTask } from "@/lib/hooks/useTasks";

export function TaskQuickAdd() {
  const [title, setTitle] = useState("");
  const createMutation = useCreateStandaloneTask();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    setTitle("");

    try {
      await createMutation.mutateAsync({
        title: trimmedTitle,
        status: "todo",
        priority: 2,
      });
    } catch {
      setTitle(trimmedTitle);
    }
  }

  return (
    <form
      className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-2 py-2 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100"
      onSubmit={handleSubmit}
    >
      <input
        className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add a task..."
      />
      <button
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-400"
        type="submit"
        disabled={createMutation.isPending || !title.trim()}
        title="Add task"
        aria-label="Add task"
      >
        {createMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </button>
    </form>
  );
}
