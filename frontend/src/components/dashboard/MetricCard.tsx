import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  helper: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
};

export function MetricCard({ helper, icon: Icon, label, value }: MetricCardProps) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-[#1A56DB]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-sm text-zinc-500">{helper}</p>
    </article>
  );
}
