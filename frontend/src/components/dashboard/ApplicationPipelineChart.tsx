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
import { surfaceCard, surfaceCardHeader } from "@/lib/ui-theme";

type ApplicationPipelineChartProps = {
  data: PipelineStatusCount[];
};

export function ApplicationPipelineChart({ data }: ApplicationPipelineChartProps) {
  return (
    <section className={`overflow-hidden ${surfaceCard}`}>
      <div className={surfaceCardHeader("violet")}>
        <h2 className="text-lg font-semibold text-zinc-950">
          Application Pipeline
        </h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Count by current Kanban status
        </p>
      </div>

      <div className="p-5">
        <div className="h-72">
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
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(24, 24, 27, 0.08)",
                }}
              />
              <Bar dataKey="count" fill="#7c3aed" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
