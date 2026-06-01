export function DashboardSkeleton() {
  return (
    <main className="cp-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <div className="h-24 max-w-2xl animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-muted)]" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              className="h-36 animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-muted)]"
              key={index}
            />
          ))}
        </div>
        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
          <div className="h-96 animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-muted)]" />
          <div className="h-96 animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-muted)]" />
        </div>
      </div>
    </main>
  );
}
