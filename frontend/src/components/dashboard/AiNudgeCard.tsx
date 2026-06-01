import Link from "next/link";

import { Badge, buttonClassName } from "@/components/ui";
import type { AiNudge } from "@/lib/reminders/types";

type AiNudgeCardProps = {
  nudge: AiNudge;
};

export function AiNudgeCard({ nudge }: AiNudgeCardProps) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Badge className="capitalize" tone="primary">{nudge.type}</Badge>
          <h3 className="mt-3 text-base font-semibold text-[var(--foreground)]">
            {nudge.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            {nudge.message}
          </p>
        </div>
        <Link
          className={buttonClassName({
            className: "shrink-0",
            size: "sm",
          })}
          href={nudge.actionHref}
        >
          {nudge.actionLabel}
        </Link>
      </div>
    </article>
  );
}
