"use client";

import {
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  Flame,
  Map,
  Target,
} from "lucide-react";

import { AiNudges } from "@/components/dashboard/AiNudges";
import { ApplicationPipelineChart } from "@/components/dashboard/ApplicationPipelineChart";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { useDashboardMetrics } from "@/lib/hooks/useDashboardMetrics";

export function DashboardPageClient() {
  const dashboard = useDashboardMetrics();

  if (dashboard.isLoading) {
    return <DashboardSkeleton />;
  }

  if (dashboard.error || !dashboard.data) {
    return (
      <main className="min-h-[calc(100vh-49px)] bg-zinc-50 px-6 py-6">
        <div className="mx-auto max-w-[1400px] rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load dashboard data. Please try again.
        </div>
      </main>
    );
  }

  const { metrics, pipeline, recentActivity, upcomingEvents } = dashboard.data;

  return (
    <main className="min-h-[calc(100vh-49px)] bg-zinc-50 px-6 py-6">
      <div className="mx-auto max-w-[1400px]">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#1A56DB]">
              CareerPilot
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-950">
              Dashboard
            </h1>
            <p className="mt-2 text-base text-zinc-600">
              Track your career progress and upcoming work.
            </p>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            helper="Applications marked as applied"
            icon={BriefcaseBusiness}
            label="Jobs Applied"
            value={metrics.jobsApplied}
          />
          <MetricCard
            helper="Currently in progress"
            icon={Target}
            label="Active Applications"
            value={metrics.activeApplications}
          />
          <MetricCard
            helper="Average progress across roadmaps"
            icon={Map}
            label="Roadmap Progress"
            value={`${metrics.roadmapProgress}%`}
          />
          <MetricCard
            helper="Completed since Monday"
            icon={CheckCircle2}
            label="Tasks Completed This Week"
            value={metrics.tasksCompletedThisWeek}
          />
          <MetricCard
            helper="Weeks with at least one completed task"
            icon={Flame}
            label="Weekly Streak"
            value={`${metrics.weeklyStreak} ${
              metrics.weeklyStreak === 1 ? "week" : "weeks"
            }`}
          />
          <MetricCard
            helper="Learning milestones completed"
            icon={CalendarCheck2}
            label="Roadmap Items Done"
            value={metrics.roadmapItemsDone}
          />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
          <ApplicationPipelineChart data={pipeline} />
          <UpcomingDeadlines events={upcomingEvents} />
        </section>

        <section className="mt-6">
          <AiNudges />
        </section>

        <section className="mt-6">
          <RecentActivityFeed items={recentActivity} />
        </section>
      </div>
    </main>
  );
}
