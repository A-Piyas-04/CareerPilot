"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui";
import type { PipelineStatusCount } from "@/lib/dashboard/types";

type ApplicationPipelineChartProps = {
  data: PipelineStatusCount[];
};

export function ApplicationPipelineChart({ data }: ApplicationPipelineChartProps) {
  return (
    <Card className="min-w-0 p-5">
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Application Pipeline
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Count by current Kanban status
        </p>
      </div>

      <div className="mt-5 h-72 min-h-72 min-w-0">
        <ResponsiveContainer height="100%" minHeight={1} minWidth={1} width="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ bottom: 8, left: 12, right: 20, top: 8 }}
          >
            <CartesianGrid horizontal={false} stroke="var(--border)" />
            <XAxis
              allowDecimals={false}
              stroke="var(--muted-foreground)"
              type="number"
            />
            <YAxis
              dataKey="label"
              stroke="var(--muted-foreground)"
              tickLine={false}
              type="category"
              width={92}
            />
            <Tooltip
              cursor={{ fill: "var(--surface-subtle)" }}
              contentStyle={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                boxShadow: "var(--shadow-soft)",
                color: "var(--foreground)",
              }}
            />
            <Bar dataKey="count" fill="var(--primary)" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
