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

import type { PipelineStatusCount } from "@/lib/dashboard/types";

type ApplicationPipelineChartProps = {
  data: PipelineStatusCount[];
};

export function ApplicationPipelineChart({ data }: ApplicationPipelineChartProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">
          Application Pipeline
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Count by current Kanban status
        </p>
      </div>

      <div className="mt-5 h-72">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ bottom: 8, left: 12, right: 20, top: 8 }}
          >
            <CartesianGrid horizontal={false} stroke="#e4e4e7" />
            <XAxis allowDecimals={false} stroke="#71717a" type="number" />
            <YAxis
              dataKey="label"
              stroke="#71717a"
              tickLine={false}
              type="category"
              width={92}
            />
            <Tooltip
              cursor={{ fill: "#f4f4f5" }}
              contentStyle={{
                border: "1px solid #e4e4e7",
                borderRadius: 8,
                boxShadow: "0 8px 24px rgba(24, 24, 27, 0.08)",
              }}
            />
            <Bar dataKey="count" fill="#1A56DB" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
