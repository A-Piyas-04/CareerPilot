"use client";

import { useEffect, useState } from "react";

import { useSimulatedProgress } from "@/hooks/useSimulatedProgress";

export type SubmissionProgressMode = "steps" | "simulated" | "indeterminate";

type SubmissionProgressProps = {
  isActive: boolean;
  mode: SubmissionProgressMode;
  steps?: readonly string[] | string[];
  activeStepIndex?: number;
  label?: string;
  intervalMs?: number;
  className?: string;
  tone?: "amber" | "blue" | "emerald" | "sky";
};

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const TONE_STYLES = {
  amber: {
    container: "border-amber-200 bg-amber-50 dark:border-amber-300/25 dark:bg-amber-400/12",
    label: "text-amber-900 dark:text-amber-100",
    sub: "text-amber-700 dark:text-amber-200/80",
    bar: "bg-amber-500",
    barTrack: "bg-amber-200 dark:bg-amber-300/20",
    stepActive: "text-amber-900 font-medium dark:text-amber-100",
    stepDone: "text-amber-600 dark:text-amber-200/80",
    stepPending: "text-amber-400 dark:text-amber-200/45",
  },
  blue: {
    container: "border-sky-200 bg-sky-50 dark:border-sky-300/25 dark:bg-sky-400/12",
    label: "text-sky-900 dark:text-sky-100",
    sub: "text-sky-700 dark:text-sky-200/80",
    bar: "bg-sky-600",
    barTrack: "bg-sky-200 dark:bg-sky-300/20",
    stepActive: "text-sky-900 font-medium dark:text-sky-100",
    stepDone: "text-sky-600 dark:text-sky-200/80",
    stepPending: "text-sky-400 dark:text-sky-200/45",
  },
  emerald: {
    container: "border-emerald-200 bg-emerald-50 dark:border-emerald-300/25 dark:bg-emerald-400/12",
    label: "text-emerald-900 dark:text-emerald-100",
    sub: "text-emerald-700 dark:text-emerald-200/80",
    bar: "bg-emerald-600",
    barTrack: "bg-emerald-200 dark:bg-emerald-300/20",
    stepActive: "text-emerald-900 font-medium dark:text-emerald-100",
    stepDone: "text-emerald-600 dark:text-emerald-200/80",
    stepPending: "text-emerald-400 dark:text-emerald-200/45",
  },
  sky: {
    container: "border-sky-200 bg-sky-50 dark:border-sky-300/25 dark:bg-sky-400/12",
    label: "text-sky-900 dark:text-sky-100",
    sub: "text-sky-700 dark:text-sky-200/80",
    bar: "bg-sky-600",
    barTrack: "bg-sky-200 dark:bg-sky-300/20",
    stepActive: "text-sky-900 font-medium dark:text-sky-100",
    stepDone: "text-sky-600 dark:text-sky-200/80",
    stepPending: "text-sky-400 dark:text-sky-200/45",
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
      setIndeterminateOffset((v) => (v + 15) % 100);
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
        ? (stepList[resolvedIndex] ?? label ?? "Processing…")
        : (label ?? "Processing…");

  const percent =
    mode === "indeterminate"
      ? undefined
      : progressPercent(resolvedIndex, stepList.length || 1);

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5",
        styles.container,
        className,
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent ?? undefined}
      aria-busy="true"
      aria-label={resolvedLabel}
    >
      <p className={cn("text-sm font-medium", styles.label)}>{resolvedLabel}</p>

      <div
        className={cn("mt-2 h-1.5 w-full overflow-hidden rounded-full", styles.barTrack)}
      >
        {mode === "indeterminate" ? (
          <div
            className={cn("h-full w-1/3 rounded-full transition-all duration-300", styles.bar)}
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
          {stepList.map((step, i) => (
            <li
              key={step}
              className={cn(
                "text-xs",
                i < resolvedIndex
                  ? styles.stepDone
                  : i === resolvedIndex
                    ? styles.stepActive
                    : styles.stepPending,
              )}
            >
              {i < resolvedIndex ? "✓ " : i === resolvedIndex ? "→ " : "· "}
              {step}
            </li>
          ))}
        </ul>
      ) : mode === "indeterminate" && label ? (
        <p className={cn("mt-1 text-xs", styles.sub)}>{label}</p>
      ) : null}
    </div>
  );
}
