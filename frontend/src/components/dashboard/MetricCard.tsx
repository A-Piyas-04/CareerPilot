import type { LucideIcon } from "lucide-react";

import { premiumCard, premiumCardHover } from "@/lib/ui-theme";

const ACCENT_STYLES = [
  "from-emerald-600 to-emerald-950 shadow-emerald-900/25",
  "from-violet-500 to-purple-900 shadow-violet-900/25",
  "from-sky-500 to-indigo-800 shadow-sky-900/25",
  "from-teal-600 to-emerald-900 shadow-teal-900/25",
  "from-amber-500 to-orange-700 shadow-amber-900/25",
  "from-indigo-500 to-violet-900 shadow-indigo-900/25",
  "from-emerald-700 to-teal-900 shadow-emerald-900/25",
] as const;

const BAR_STYLES = [
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-purple-500",
  "from-sky-500 to-cyan-500",
  "from-teal-500 to-emerald-500",
  "from-amber-500 to-orange-500",
  "from-indigo-500 to-violet-500",
  "from-emerald-600 to-emerald-800",
] as const;

type MetricCardProps = {
  helper: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
  index?: number;
};

export function MetricCard({
  helper,
  icon: Icon,
  label,
  value,
  index = 0,
}: MetricCardProps) {
  const accentIdx = index % ACCENT_STYLES.length;
  const iconGradient = ACCENT_STYLES[accentIdx];
  const barGradient = BAR_STYLES[accentIdx];

  return (
    <article className={`relative overflow-hidden p-5 ${premiumCard} ${premiumCardHover}`}>
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${barGradient}`}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${iconGradient}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-sm text-zinc-500">{helper}</p>
    </article>
  );
}
