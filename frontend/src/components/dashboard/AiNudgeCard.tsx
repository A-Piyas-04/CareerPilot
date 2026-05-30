"use client";

import Link from "next/link";

import { Badge } from "@/components/ui";
import type { AiNudge } from "@/lib/reminders/types";
import { btnPrimary, premiumCard, premiumCardHover } from "@/lib/ui-theme";

type AiNudgeCardProps = {
  nudge: AiNudge;
};

export function AiNudgeCard({ nudge }: AiNudgeCardProps) {
  return (
    <article
      className={`border border-sky-200/60 bg-gradient-to-br from-sky-50/80 to-white p-4 ${premiumCard} ${premiumCardHover}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Badge tone="aiGenerated" className="capitalize">
            {nudge.type}
          </Badge>
          <h3 className="mt-3 text-base font-semibold text-zinc-950">
            {nudge.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{nudge.message}</p>
        </div>
        <Link className={`${btnPrimary} shrink-0`} href={nudge.actionHref}>
          {nudge.actionLabel}
        </Link>
      </div>
    </article>
  );
}
