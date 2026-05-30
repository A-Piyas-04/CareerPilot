"use client";

import {
  LineChart,
  Mail,
  Map,
  MessageSquareText,
  BriefcaseBusiness,
} from "lucide-react";
import { TransitionLink } from "@/components/navigation/navigation-transition";

import type { JobActionKey, JobActionLink } from "./job-actions";
import { getMatchJobActions } from "./job-actions";
import type { MatchSummary } from "./types";

const ICONS: Record<JobActionKey, typeof Mail> = {
  coverLetter: Mail,
  skillGap: LineChart,
  roadmap: Map,
  chat: MessageSquareText,
  tracker: BriefcaseBusiness,
};

type Props = {
  match: MatchSummary;
  applicationId?: string | null;
  variant?: "compact" | "full";
  className?: string;
};

export function MatchJobActions({
  match,
  applicationId,
  variant = "full",
  className = "",
}: Props) {
  const actions = getMatchJobActions(match, { applicationId });

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
      className={
        variant === "compact"
          ? "flex h-9 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
          : "flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
      }
    >
      <Icon className={variant === "compact" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {label}
    </TransitionLink>
  );
}
