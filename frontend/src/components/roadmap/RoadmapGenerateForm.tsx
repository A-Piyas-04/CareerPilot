"use client";

import { Loader2, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";

import type { GenerateRoadmapRequest } from "@/lib/roadmap/types";

type RoadmapGenerateFormProps = {
  isGenerating: boolean;
  onGenerate: (payload: GenerateRoadmapRequest) => void;
};

const DURATIONS = [4, 8, 12] as const;

export function RoadmapGenerateForm({
  isGenerating,
  onGenerate,
}: RoadmapGenerateFormProps) {
  const [targetRole, setTargetRole] = useState("");
  const [durationWeeks, setDurationWeeks] =
    useState<GenerateRoadmapRequest["durationWeeks"]>(8);
  const [jobDescription, setJobDescription] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!targetRole.trim() || isGenerating) {
      return;
    }

    onGenerate({
      durationWeeks,
      jobDescription: jobDescription.trim() || undefined,
      targetRole: targetRole.trim(),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-zinc-950">
          Roadmap Generator
        </h1>
        <p className="text-sm text-zinc-600">
          Generate a CV-aware weekly plan for a target role.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800">Target role</span>
          <input
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            placeholder="ML Engineer"
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800">Duration</span>
          <select
            value={durationWeeks}
            onChange={(event) =>
              setDurationWeeks(Number(event.target.value) as 4 | 8 | 12)
            }
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
          >
            {DURATIONS.map((duration) => (
              <option key={duration} value={duration}>
                {duration} weeks
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-800">
          Job description
        </span>
        <textarea
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Paste an optional job description to tailor the roadmap."
          className="min-h-28 resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={isGenerating || !targetRole.trim()}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1A56DB] px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate Roadmap
        </button>
      </div>
    </form>
  );
}
