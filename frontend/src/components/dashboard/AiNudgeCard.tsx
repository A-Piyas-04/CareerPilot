import Link from "next/link";

import type { AiNudge } from "@/lib/reminders/types";

type AiNudgeCardProps = {
  nudge: AiNudge;
};

export function AiNudgeCard({ nudge }: AiNudgeCardProps) {
  return (
    <article className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold capitalize text-[#1A56DB]">
            {nudge.type}
          </span>
          <h3 className="mt-3 text-base font-semibold text-zinc-950">
            {nudge.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{nudge.message}</p>
        </div>
        <Link
          className="inline-flex h-9 shrink-0 items-center rounded-md bg-[#1A56DB] px-3 text-sm font-semibold text-white hover:bg-blue-700"
          href={nudge.actionHref}
        >
          {nudge.actionLabel}
        </Link>
      </div>
    </article>
  );
}
