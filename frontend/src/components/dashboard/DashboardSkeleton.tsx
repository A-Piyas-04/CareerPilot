import { PageShell } from "@/components/layout";

export function DashboardSkeleton() {
  return (
    <PageShell width="wide">
      <div className="h-16 max-w-md animate-pulse rounded-xl bg-zinc-200" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="h-32 animate-pulse rounded-xl bg-zinc-200"
            key={index}
          />
        ))}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <div className="h-96 animate-pulse rounded-xl bg-zinc-200" />
        <div className="h-96 animate-pulse rounded-xl bg-zinc-200" />
      </div>
    </PageShell>
  );
}
