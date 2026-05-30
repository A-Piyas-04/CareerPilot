import type { ReactNode } from "react";

import { Skeleton, SkeletonText } from "./skeleton";

function NavStripSkeleton() {
  return (
    <div className="border-b border-zinc-200 bg-white px-6 py-3" aria-busy="true">
      <div className="mx-auto flex max-w-6xl items-center gap-4">
        <Skeleton className="h-6 w-24" />
        <div className="flex flex-1 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
      </div>
    </div>
  );
}

type ListCardSkeletonProps = {
  count?: number;
  cardClassName?: string;
  className?: string;
};

export function ListCardSkeleton({
  count = 3,
  cardClassName = "h-36",
  className,
}: ListCardSkeletonProps) {
  return (
    <div className={className ?? "grid gap-3"} aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton
          key={i}
          className={`rounded-lg border border-zinc-200 bg-white ${cardClassName}`}
        />
      ))}
    </div>
  );
}

type DetailPageSkeletonProps = {
  contentHeight?: string;
  timelineCount?: number;
};

export function DetailPageSkeleton({
  contentHeight = "h-[520px]",
  timelineCount = 0,
}: DetailPageSkeletonProps) {
  return (
    <main
      className="min-h-[calc(100vh-49px)] bg-zinc-50 px-6 py-6"
      aria-busy="true"
    >
      <div className="mx-auto max-w-5xl">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-8 w-64" />
        <Skeleton
          className={`mt-4 rounded-lg border border-zinc-200 bg-white ${contentHeight}`}
        />
        {timelineCount > 0 ? (
          <div className="mt-4 grid gap-3">
            {Array.from({ length: timelineCount }, (_, i) => (
              <Skeleton
                key={i}
                className="h-44 rounded-lg border border-zinc-200 bg-white"
              />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}

type PageSkeletonVariant =
  | "twoColumn"
  | "singleColumn"
  | "resume"
  | "tracker"
  | "jobs"
  | "calendar"
  | "chat";

type PageSkeletonProps = {
  variant?: PageSkeletonVariant;
  showNav?: boolean;
};

export function PageSkeleton({
  variant = "singleColumn",
  showNav = true,
}: PageSkeletonProps) {
  return (
    <>
      {showNav ? <NavStripSkeleton /> : null}
      {variant === "chat" ? <ChatPageSkeleton /> : null}
      {variant === "twoColumn" ? <TwoColumnPageSkeleton /> : null}
      {variant === "resume" ? <ResumePageSkeleton /> : null}
      {variant === "tracker" ? <TrackerPageSkeleton /> : null}
      {variant === "jobs" ? <JobsPageSkeleton /> : null}
      {variant === "calendar" ? <CalendarPageSkeleton /> : null}
      {variant === "singleColumn" ? <SingleColumnPageSkeleton /> : null}
    </>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="min-h-[calc(100vh-49px)] bg-zinc-50 px-6 py-6"
      aria-busy="true"
    >
      {children}
    </main>
  );
}

function TwoColumnPageSkeleton() {
  return (
    <PageShell>
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Skeleton className="h-96 rounded-lg border border-zinc-200 bg-white" />
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-56" />
          <ListCardSkeleton count={3} className="mt-4 grid gap-3" />
        </div>
      </div>
    </PageShell>
  );
}

function SingleColumnPageSkeleton() {
  return (
    <PageShell>
      <div className="mx-auto max-w-5xl">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-md" />
          ))}
        </div>
        <ListCardSkeleton count={3} cardClassName="h-44" className="mt-6 space-y-3" />
      </div>
    </PageShell>
  );
}

function ResumePageSkeleton() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl border border-zinc-200 bg-white" />
        <ResumeSummarySkeleton />
      </div>
    </PageShell>
  );
}

export function ResumeSummarySkeleton() {
  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
      aria-busy="true"
    >
      <Skeleton className="h-5 w-36" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-1 h-4 w-32" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-6 h-4 w-32" />
      <div className="mt-3 space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    </section>
  );
}

function TrackerPageSkeleton() {
  return (
    <PageShell>
      <div className="mx-auto max-w-[1400px]">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96 rounded-lg bg-zinc-100" />
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function JobsPageSkeleton() {
  return (
    <PageShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-40 rounded-lg border border-zinc-200 bg-white" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg border border-zinc-200 bg-white" />
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function CalendarPageSkeleton() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
        <Skeleton className="mt-6 h-[600px] rounded-lg border border-zinc-200 bg-white" />
      </div>
    </PageShell>
  );
}

function ChatPageSkeleton() {
  return (
    <div className="flex h-screen bg-zinc-50" aria-busy="true">
      <aside className="w-72 border-r border-zinc-200 bg-white p-4">
        <Skeleton className="h-9 w-full rounded-md" />
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <div className="border-b border-zinc-200 p-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 space-y-4 p-6">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className={`h-16 rounded-lg ${i % 2 === 0 ? "ml-auto w-2/3" : "w-2/3"}`}
            />
          ))}
        </div>
        <div className="border-t border-zinc-200 p-4">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function DrawerSkeleton() {
  return (
    <div className="flex flex-1 flex-col p-5" aria-busy="true">
      <SkeletonText lines={2} />
      <div className="mt-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i}>
            <Skeleton className="mb-1.5 h-3 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  );
}

export function ModalSkeleton() {
  return (
    <div className="space-y-4 p-1" aria-busy="true">
      <Skeleton className="h-5 w-48" />
      <SkeletonText lines={2} />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton className="mb-1 h-3 w-16" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
