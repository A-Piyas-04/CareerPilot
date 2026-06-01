import type { LucideIcon } from "lucide-react";

import { StatCard } from "@/components/ui";

type MetricCardProps = {
  helper: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
};

export function MetricCard({ helper, icon: Icon, label, value }: MetricCardProps) {
  return (
    <StatCard helper={helper} icon={Icon} label={label} value={value} />
  );
}
