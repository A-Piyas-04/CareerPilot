"use client";

import { useQuery } from "@tanstack/react-query";

import type { DashboardMetricsResponse } from "@/lib/dashboard/types";

export function useDashboardMetrics() {
  return useQuery({
    queryFn: () => requestJson<DashboardMetricsResponse>("/api/dashboard/metrics"),
    queryKey: ["dashboard", "metrics"],
  });
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = (await response.json().catch(() => ({}))) as {
    detail?: string;
  };

  if (!response.ok) {
    throw new Error(payload.detail ?? "Request failed.");
  }

  return payload as T;
}
