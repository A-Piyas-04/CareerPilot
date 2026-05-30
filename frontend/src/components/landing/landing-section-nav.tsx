"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type LandingNavAnchor = {
  href: string;
  label: string;
};

type LandingSectionNavProps = {
  items: readonly LandingNavAnchor[];
};

const HEADER_OFFSET = 88;

export function LandingSectionNav({ items }: LandingSectionNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback((index: number) => {
    const link = linkRefs.current[index];
    const container = containerRef.current;
    if (!link || !container) return;

    setIndicator({
      left: link.offsetLeft,
      width: link.offsetWidth,
    });
  }, []);

  useLayoutEffect(() => {
    updateIndicator(activeIndex);
  }, [activeIndex, updateIndicator]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => updateIndicator(activeIndex));
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeIndex, updateIndicator]);

  useEffect(() => {
    const sectionIds = items.map((item) => item.href.slice(1));

    const syncActiveFromScroll = () => {
      let nextIndex = 0;
      for (let i = 0; i < sectionIds.length; i++) {
        const el = document.getElementById(sectionIds[i]!);
        if (el && el.offsetTop - HEADER_OFFSET <= window.scrollY + 1) {
          nextIndex = i;
        }
      }
      setActiveIndex(nextIndex);
    };

    syncActiveFromScroll();
    window.addEventListener("scroll", syncActiveFromScroll, { passive: true });
    return () => window.removeEventListener("scroll", syncActiveFromScroll);
  }, [items]);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center rounded-full border border-zinc-200/90 bg-zinc-100 p-1 shadow-inner shadow-zinc-900/[0.05]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-1 bottom-1 rounded-full bg-white shadow-sm ring-1 ring-zinc-200/70 transition-[left,width] duration-300 ease-linear"
        style={{ left: indicator.left, width: indicator.width }}
      />
      {items.map((item, index) => {
        const isActive = activeIndex === index;
        return (
          <a
            key={item.href}
            ref={(el) => {
              linkRefs.current[index] = el;
            }}
            href={item.href}
            aria-current={isActive ? "location" : undefined}
            onClick={() => setActiveIndex(index)}
            className={`relative z-10 rounded-full px-5 py-2.5 text-[15px] font-medium tracking-wide transition-colors duration-300 ease-linear ${
              isActive
                ? "text-emerald-900"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
}
