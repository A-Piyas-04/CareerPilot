"use client";

import {
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  Flame,
  LayoutDashboard,
  Map,
  Sparkles,
  Target,
} from "lucide-react";

import { AiNudges } from "@/components/dashboard/AiNudges";
import { ApplicationPipelineChart } from "@/components/dashboard/ApplicationPipelineChart";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { PageHeader, PageShell } from "@/components/layout";
import { TransitionLink } from "@/components/navigation/navigation-transition";
import { PAGE_RELATED_LINKS } from "@/lib/navigation-config";
import { alertError, btnPrimary, btnSecondary } from "@/lib/ui-theme";
import { useDashboardMetrics } from "@/lib/hooks/useDashboardMetrics";

export function DashboardPageClient() {
  const dashboard = useDashboardMetrics();

  if (dashboard.isLoading) {
    return <DashboardSkeleton />;
  }

  if (dashboard.error || !dashboard.data) {
    return (
      <PageShell width="wide">
        <div className={alertError}>
          Could not load dashboard data. Please try again.
        </div>
      </PageShell>
    );
  }

  const { metrics, pipeline, recentActivity, upcomingEvents } = dashboard.data;

  return (
    <PageShell width="wide">
      <PageHeader
        accent="violet"
        eyebrowText="Track"
        icon={LayoutDashboard}
        title="Dashboard"
        description="Track your career progress, pipeline health, and AI nudges in one view."
        relatedLinks={PAGE_RELATED_LINKS["/dashboard"]}
        nextAction={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-700">
              <span className="font-semibold text-violet-900">Next step:</span>{" "}
              Run a job search or upload your CV to unlock richer insights.
            </p>
            <div className="flex flex-wrap gap-2">
              <TransitionLink href="/jobs" className={btnPrimary}>
                Search jobs
              </TransitionLink>
              <TransitionLink href="/resume" className={btnSecondary}>
                Upload CV
              </TransitionLink>
            </div>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          helper="Applications marked as applied"
          icon={BriefcaseBusiness}
          index={0}
          label="Jobs Applied"
          value={metrics.jobsApplied}
        />
        <MetricCard
          helper="Currently in progress"
          icon={Target}
          index={1}
          label="Active Applications"
          value={metrics.activeApplications}
        />
        <MetricCard
          helper="Average progress across roadmaps"
          icon={Map}
          index={2}
          label="Roadmap Progress"
          value={`${metrics.roadmapProgress}%`}
        />
        <MetricCard
          helper="Completed since Monday"
          icon={CheckCircle2}
          index={3}
          label="Tasks Completed This Week"
          value={metrics.tasksCompletedThisWeek}
        />
        <MetricCard
          helper="Weeks with at least one completed task"
          icon={Flame}
          index={4}
          label="Weekly Streak"
          value={`${metrics.weeklyStreak} ${
            metrics.weeklyStreak === 1 ? "week" : "weeks"
          }`}
        />
        <MetricCard
          helper="Skills indexed from your CV"
          icon={Sparkles}
          index={5}
          label="Skills Added"
          value={metrics.skillsAdded}
        />
        <MetricCard
          helper="Learning milestones completed"
          icon={CalendarCheck2}
          index={6}
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
    </PageShell>
  );
}
