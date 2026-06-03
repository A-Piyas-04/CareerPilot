"use client";

import { usePathname } from "next/navigation";

import { TransitionLink } from "@/components/navigation/navigation-transition";
import { getRelatedLinks } from "@/lib/navigation-config";
import { relatedLinkPill } from "@/lib/ui-theme";
import { getAccentForPath } from "@/lib/nav-styles";

export function AppFooter() {
  const pathname = usePathname();
  const relatedLinks = getRelatedLinks(pathname);
  const accent = getAccentForPath(pathname);

  return (
    <footer
      className="shrink-0 border-t border-[var(--cp-footer-border)] bg-[var(--cp-footer-bg)] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] sm:px-6"
      aria-label="Site footer"
    >
      <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900">CareerPilot</p>
          <p className="mt-0.5 text-xs text-zinc-600">
            AI-powered career co-pilot — track applications, grow skills, and
            land your next role.
          </p>
        </div>

        {relatedLinks.length > 0 && (
          <nav
            aria-label="Related pages"
            className="flex flex-wrap gap-2"
          >
            {relatedLinks.map((link) => (
              <TransitionLink
                key={link.href}
                href={link.href}
                className={relatedLinkPill(accent)}
              >
                {link.label}
              </TransitionLink>
            ))}
          </nav>
        )}
      </div>

      <p className="mx-auto mt-4 w-full max-w-[1560px] border-t border-slate-400/40 pt-4 text-center text-[11px] text-slate-600 sm:text-left">
        © {new Date().getFullYear()} CareerPilot · Your data stays in your
        account
      </p>
    </footer>
  );
}
