"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

import { ContentPageSkeleton } from "@/components/ui/skeleton-layouts";
import {
  getSkeletonVariantForHref,
  normalizeRoutePath,
  routesMatch,
} from "@/lib/navigation-transition/route-skeleton";

type NavigationTransitionContextValue = {
  pendingHref: string | null;
  startNavigation: (href: string) => void;
  clearNavigation: () => void;
};

const NavigationTransitionContext =
  createContext<NavigationTransitionContextValue | null>(null);

export function NavigationTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const clearNavigation = useCallback(() => {
    setPendingHref(null);
  }, []);

  const startNavigation = useCallback(
    (href: string) => {
      const target = normalizeRoutePath(href);
      const current = normalizeRoutePath(pathname);

      if (target === current) {
        return;
      }

      setPendingHref(href);
    },
    [pathname],
  );

  useEffect(() => {
    if (!pendingHref) {
      return;
    }

    if (routesMatch(pathname, pendingHref)) {
      setPendingHref(null);
    }
  }, [pathname, pendingHref]);

  useEffect(() => {
    if (!pendingHref) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setPendingHref(null);
    }, 15_000);

    return () => window.clearTimeout(timeout);
  }, [pendingHref]);

  const value = useMemo(
    () => ({
      pendingHref,
      startNavigation,
      clearNavigation,
    }),
    [pendingHref, startNavigation, clearNavigation],
  );

  return (
    <NavigationTransitionContext.Provider value={value}>
      {children}
    </NavigationTransitionContext.Provider>
  );
}

export function useNavigationTransition() {
  const context = useContext(NavigationTransitionContext);
  if (!context) {
    throw new Error(
      "useNavigationTransition must be used within NavigationTransitionProvider",
    );
  }
  return context;
}

export function NavigationTransitionShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { pendingHref } = useNavigationTransition();

  const showOverlay =
    Boolean(pendingHref) && !routesMatch(pathname, pendingHref);
  const variant = pendingHref
    ? getSkeletonVariantForHref(pendingHref)
    : "singleColumn";

  return (
    <div className="relative min-h-[calc(100vh-var(--cp-nav-height))] lg:min-h-[calc(100vh-var(--cp-nav-with-context))]">
      {showOverlay ? (
        <div
          className="cp-page-transition absolute inset-0 z-20 overflow-hidden bg-[var(--cp-page-bg)]"
          aria-busy="true"
          aria-live="polite"
          aria-label="Loading page"
        >
          <ContentPageSkeleton variant={variant} />
        </div>
      ) : null}
      <div className={showOverlay ? "invisible" : "cp-page-transition"}>
        {children}
      </div>
    </div>
  );
}

type TransitionLinkProps = ComponentProps<typeof Link>;

export function TransitionLink({
  href,
  onClick,
  prefetch,
  ...props
}: TransitionLinkProps) {
  const { startNavigation } = useNavigationTransition();

  const resolvedHref = typeof href === "string" ? href : href.pathname ?? "/";

  return (
    <Link
      href={href}
      prefetch={prefetch ?? true}
      onClick={(event) => {
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          onClick?.(event);
          return;
        }

        startNavigation(resolvedHref);
        onClick?.(event);
      }}
      {...props}
    />
  );
}
