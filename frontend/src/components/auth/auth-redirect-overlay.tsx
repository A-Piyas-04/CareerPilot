import { ContentPageSkeleton } from "@/components/ui/skeleton-layouts";
import { getSkeletonVariantForHref } from "@/lib/navigation-transition/route-skeleton";

type AuthRedirectOverlayProps = {
  destination: string;
  label?: string;
};

export function AuthRedirectOverlay({
  destination,
  label = "Opening your workspace…",
}: AuthRedirectOverlayProps) {
  const variant = getSkeletonVariantForHref(destination);

  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--cp-page-bg)]"
      aria-busy="true"
      role="status"
      aria-live="polite"
    >
      <p className="sr-only">{label}</p>
      <ContentPageSkeleton variant={variant} />
    </div>
  );
}
