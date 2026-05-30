import type { ReactNode } from "react";

import {
  badgeAiGenerated,
  badgeBase,
  badgeCompleted,
  badgeDeadline,
  badgeFitScore,
  badgeInProgress,
  badgeLiveSearch,
  badgeRag,
} from "@/lib/ui-theme";

export type BadgeTone =
  | "rag"
  | "liveSearch"
  | "fitScore"
  | "aiGenerated"
  | "deadline"
  | "inProgress"
  | "completed"
  | "neutral"
  | "emerald"
  | "sky"
  | "violet"
  | "amber";

const TONE_CLASSES: Record<BadgeTone, string> = {
  rag: badgeRag,
  liveSearch: badgeLiveSearch,
  fitScore: badgeFitScore,
  aiGenerated: badgeAiGenerated,
  deadline: badgeDeadline,
  inProgress: badgeInProgress,
  completed: badgeCompleted,
  neutral: `${badgeBase} bg-zinc-100 text-zinc-700 ring-zinc-200/70`,
  emerald: `${badgeBase} bg-emerald-50 text-emerald-800 ring-emerald-200/70`,
  sky: `${badgeBase} bg-sky-50 text-sky-800 ring-sky-200/70`,
  violet: `${badgeBase} bg-violet-50 text-violet-800 ring-violet-200/70`,
  amber: `${badgeBase} bg-amber-50 text-amber-900 ring-amber-200/70`,
};

type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
};

export function Badge({
  tone = "neutral",
  children,
  className,
  icon,
}: BadgeProps) {
  return (
    <span className={[TONE_CLASSES[tone], className].filter(Boolean).join(" ")}>
      {icon ? <span className="shrink-0">{icon}</span> : null}
      {children}
    </span>
  );
}
