"use client";

import { Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";

import { Card, Input, Select, SpinnerButton, Textarea } from "@/components/ui";
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
    <Card className="p-5">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Roadmap Generator
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Generate a CV-aware weekly plan for a target role.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Target role
            </span>
            <Input
              value={targetRole}
              onChange={(event) => setTargetRole(event.target.value)}
              placeholder="ML Engineer"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Duration
            </span>
            <Select
              value={durationWeeks}
              onChange={(event) =>
                setDurationWeeks(Number(event.target.value) as 4 | 8 | 12)
              }
            >
              {DURATIONS.map((duration) => (
                <option key={duration} value={duration}>
                  {duration} weeks
                </option>
              ))}
            </Select>
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Job description
          </span>
          <Textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste an optional job description to tailor the roadmap."
            className="min-h-28 resize-y"
          />
        </label>

        <div className="mt-5 flex justify-end">
          <SpinnerButton
            type="submit"
            loading={isGenerating}
            loadingLabel="Generating..."
            disabled={isGenerating || !targetRole.trim()}
            icon={<Sparkles className="h-4 w-4" />}
          >
            Generate Roadmap
          </SpinnerButton>
        </div>
      </form>
    </Card>
  );
}
