import type { ComponentPropsWithoutRef } from "react";

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

type SkeletonProps = ComponentPropsWithoutRef<"div">;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-busy="true"
      className={cn("animate-pulse rounded bg-zinc-200", className)}
      {...props}
    />
  );
}

type SkeletonTextProps = {
  lines?: number;
  className?: string;
};

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  const widths = ["w-full", "w-5/6", "w-4/6", "w-3/4"];
  return (
    <div className={cn("space-y-2", className)} aria-busy="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn("h-3", widths[i % widths.length])} />
      ))}
    </div>
  );
}
