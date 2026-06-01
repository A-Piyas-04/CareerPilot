"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  Flame,
  LayoutDashboard,
  Map,
  Target,
} from "lucide-react";
import Link from "next/link";

import { AiNudges } from "@/components/dashboard/AiNudges";
import { ApplicationPipelineChart } from "@/components/dashboard/ApplicationPipelineChart";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { Badge, Card, PageHeader, buttonClassName } from "@/components/ui";
import { useDashboardMetrics } from "@/lib/hooks/useDashboardMetrics";

export function DashboardPageClient() {
  const dashboard = useDashboardMetrics();

  if (dashboard.isLoading) {
    return <DashboardSkeleton />;
  }

  if (dashboard.error || !dashboard.data) {
    return (
      <main className="cp-page px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px] rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
          Could not load dashboard data. Please try again.
        </div>
      </main>
    );
  }

  const { metrics, nextActions, pipeline, recentActivity, upcomingEvents } =
    dashboard.data;

  return (
    <main className="cp-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <PageHeader
          eyebrow="CareerPilot"
          icon={LayoutDashboard}
          title="Command Center"
          description="A single cockpit for your applications, tasks, deadlines, learning plans, and AI nudges."
          actions={
            <>
              <Link
                className={buttonClassName({ variant: "secondary" })}
                href="/jobs"
              >
                Find matches
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className={buttonClassName()} href="/tracker">
                Open tracker
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          }
        />

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

        {nextActions.length > 0 ? (
          <Card className="mt-6 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  Recommended next actions
                </h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Based on your current tasks, calendar, and roadmap progress.
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {nextActions.map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[var(--shadow-soft)]"
                >
                  <Badge tone="primary">{action.type}</Badge>
                  <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">
                    {action.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                    {action.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)]">
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        ) : null}

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
