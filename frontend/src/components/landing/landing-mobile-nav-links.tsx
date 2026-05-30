"use client";

import { ChevronRight } from "lucide-react";

import {
  scrollToLandingSection,
  type LandingNavAnchor,
} from "@/components/landing/landing-section-nav";

type LandingMobileNavLinksProps = {
  items: readonly LandingNavAnchor[];
};

export function LandingMobileNavLinks({ items }: LandingMobileNavLinksProps) {
  function handleClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    event.preventDefault();
    scrollToLandingSection(href);
    const details = event.currentTarget.closest("details");
    if (details) {
      details.open = false;
    }
  }

  return (
    <>
      {items.map((item) => (
        <a
          key={item.href}
          className="flex items-center justify-between rounded-xl px-3 py-2.5 text-base font-medium text-zinc-700 transition hover:bg-emerald-50 hover:text-emerald-900"
          href={item.href}
          onClick={(event) => handleClick(event, item.href)}
        >
          {item.label}
          <ChevronRight className="h-4 w-4 text-zinc-400" aria-hidden />
        </a>
      ))}
    </>
  );
}
