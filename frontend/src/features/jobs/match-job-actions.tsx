"use client";

import { LineChart, Mail, Map, MapPinned, MessageSquareText } from "lucide-react";
import { TransitionLink } from "@/components/navigation/navigation-transition";

import type { JobActionKey, JobActionLink } from "./job-actions";
import { getMatchJobActions } from "./job-actions";
import type { MatchSummary } from "./types";

const ICONS: Record<JobActionKey, typeof Mail> = {
  evidenceMap: MapPinned,
  coverLetter: Mail,
  skillGap: LineChart,
  roadmap: Map,
  chat: MessageSquareText,
};

const actionBtnBase =
  "rounded-md border border-zinc-300 bg-white font-medium text-zinc-700 shadow-sm shadow-zinc-900/5 ring-1 ring-zinc-200/60 transition hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-md hover:shadow-zinc-900/10";

export const matchJobActionBtnFull = `flex h-10 items-center gap-2 px-3 text-sm ${actionBtnBase}`;
export const matchJobActionBtnCompact = `flex h-9 items-center gap-1.5 px-2.5 text-xs ${actionBtnBase}`;

type Props = {
  match: MatchSummary;
  variant?: "compact" | "full";
  className?: string;
};

export function MatchJobActions({
  match,
  variant = "full",
  className = "",
}: Props) {
  const actions = getMatchJobActions(match);

  if (!actions.length) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {actions.map((action) => (
        <JobActionLinkButton key={action.key} action={action} variant={variant} />
      ))}
    </div>
  );
}

function JobActionLinkButton({
  action,
  variant,
}: {
  action: JobActionLink;
  variant: "compact" | "full";
}) {
  const Icon = ICONS[action.key];
  const label = variant === "compact" ? action.shortLabel : action.label;

  return (
    <TransitionLink
      href={action.href}
      className={variant === "compact" ? matchJobActionBtnCompact : matchJobActionBtnFull}
    >
      <Icon className={variant === "compact" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {label}
    </TransitionLink>
  );
}
