import Link from "next/link";

import type { AiNudge } from "@/lib/reminders/types";

type AiNudgeCardProps = {
  nudge: AiNudge;
};

export function AiNudgeCard({ nudge }: AiNudgeCardProps) {
  return (
    <article className="rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold capitalize text-emerald-800">
            {nudge.type}
          </span>
          <h3 className="mt-3 text-base font-semibold text-zinc-950">
            {nudge.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{nudge.message}</p>
        </div>
        <Link
          className="inline-flex h-9 shrink-0 items-center rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800"
          href={nudge.actionHref}
        >
          {nudge.actionLabel}
        </Link>
      </div>
    </article>
  );
}
