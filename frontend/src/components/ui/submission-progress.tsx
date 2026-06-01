"use client";

import { useEffect, useState } from "react";

import { useSimulatedProgress } from "@/hooks/useSimulatedProgress";

import { cn } from "./cn";

export type SubmissionProgressMode = "steps" | "simulated" | "indeterminate";

type SubmissionProgressProps = {
  isActive: boolean;
  mode: SubmissionProgressMode;
  steps?: readonly string[] | string[];
  activeStepIndex?: number;
  label?: string;
  intervalMs?: number;
  className?: string;
  tone?: "amber" | "blue";
};

const TONE_STYLES = {
  amber: {
    container: "border-[var(--warning)]/30 bg-[var(--warning-soft)]",
    label: "text-[var(--warning)]",
    sub: "text-[var(--warning)]",
    bar: "bg-[var(--warning)]",
    barTrack: "bg-[var(--surface-muted)]",
    stepActive: "text-[var(--warning)] font-medium",
    stepDone: "text-[var(--warning)]/80",
    stepPending: "text-[var(--muted)]",
  },
  blue: {
    container: "border-[var(--primary)]/30 bg-[var(--primary-soft)]",
    label: "text-[var(--primary)]",
    sub: "text-[var(--primary)]",
    bar: "bg-[var(--primary)]",
    barTrack: "bg-[var(--surface-muted)]",
    stepActive: "text-[var(--primary)] font-medium",
    stepDone: "text-[var(--primary)]/80",
    stepPending: "text-[var(--muted)]",
  },
};

function progressPercent(index: number, total: number): number {
  if (total <= 1) return 100;
  return Math.round((index / (total - 1)) * 100);
}

export function SubmissionProgress({
  isActive,
  mode,
  steps = [],
  activeStepIndex = 0,
  label,
  intervalMs = 2500,
  className,
  tone = "amber",
}: SubmissionProgressProps) {
  const simulated = useSimulatedProgress({
    isActive: isActive && mode === "simulated",
    steps: [...steps],
    intervalMs,
  });

  const [indeterminateOffset, setIndeterminateOffset] = useState(0);

  useEffect(() => {
    if (!isActive || mode !== "indeterminate") return;
    const id = window.setInterval(() => {
      setIndeterminateOffset((value) => (value + 15) % 100);
    }, 400);
    return () => window.clearInterval(id);
  }, [isActive, mode]);

  if (!isActive) return null;

  const styles = TONE_STYLES[tone];
  const stepList = [...steps];

  const resolvedIndex =
    mode === "simulated" ? simulated.activeIndex : activeStepIndex;
  const resolvedLabel =
    mode === "simulated"
      ? simulated.currentLabel
      : mode === "steps"
        ? (stepList[resolvedIndex] ?? label ?? "Processing...")
        : (label ?? "Processing...");

  const percent =
    mode === "indeterminate"
      ? undefined
      : progressPercent(resolvedIndex, stepList.length || 1);

  return (
    <div
      className={cn("rounded-2xl border px-3 py-2.5", styles.container, className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent ?? undefined}
      aria-busy="true"
      aria-label={resolvedLabel}
    >
      <p className={cn("text-sm font-medium", styles.label)}>{resolvedLabel}</p>

      <div
        className={cn(
          "mt-2 h-1.5 w-full overflow-hidden rounded-full",
          styles.barTrack,
        )}
      >
        {mode === "indeterminate" ? (
          <div
            className={cn(
              "h-full w-1/3 rounded-full transition-all duration-300",
              styles.bar,
            )}
            style={{ marginLeft: `${indeterminateOffset}%` }}
          />
        ) : (
          <div
            className={cn("h-full rounded-full transition-all duration-500", styles.bar)}
            style={{ width: `${percent ?? 0}%` }}
          />
        )}
      </div>

      {mode !== "indeterminate" && stepList.length > 1 ? (
        <ul className="mt-2 space-y-0.5">
          {stepList.map((step, index) => (
            <li
              key={step}
              className={cn(
                "text-xs",
                index < resolvedIndex
                  ? styles.stepDone
                  : index === resolvedIndex
                    ? styles.stepActive
                    : styles.stepPending,
              )}
            >
              {index < resolvedIndex
                ? "Done: "
                : index === resolvedIndex
                  ? "Now: "
                  : "- "}
              {step}
            </li>
          ))}
        </ul>
      ) : mode === "indeterminate" && label && label !== resolvedLabel ? (
        <p className={cn("mt-1 text-xs", styles.sub)}>{label}</p>
      ) : null}
    </div>
  );
}
