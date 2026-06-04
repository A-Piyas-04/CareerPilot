"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type JobsHelpStep = {
  title: string;
  description: string;
};

type JobsPageHelpButtonProps = {
  description: string;
  steps: JobsHelpStep[];
};

const PANEL_WIDTH = 360;
const VIEWPORT_MARGIN = 16;
const GAP = 8;

export function JobsPageHelpButton({
  description,
  steps,
}: JobsPageHelpButtonProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setPanelStyle(null);
      return;
    }

    function updatePosition() {
      const button = buttonRef.current;
      const panel = panelRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const panelHeight = panel?.offsetHeight ?? 320;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = rect.right - PANEL_WIDTH;
      left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(left, viewportWidth - PANEL_WIDTH - VIEWPORT_MARGIN),
      );

      const spaceBelow = viewportHeight - rect.bottom - GAP - VIEWPORT_MARGIN;
      const spaceAbove = rect.top - GAP - VIEWPORT_MARGIN;
      const preferBelow = spaceBelow >= Math.min(panelHeight, 200) || spaceBelow >= spaceAbove;

      let top: number;
      let maxHeight: number;

      if (preferBelow) {
        top = rect.bottom + GAP;
        maxHeight = Math.max(160, spaceBelow);
      } else {
        maxHeight = Math.max(160, spaceAbove);
        top = Math.max(VIEWPORT_MARGIN, rect.top - GAP - Math.min(panelHeight, maxHeight));
      }

      setPanelStyle({ top, left, maxHeight });
    }

    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, steps, description]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const panel =
    open && mounted ? (
      <div
        id={panelId}
        ref={panelRef}
        role="dialog"
        aria-labelledby={`${panelId}-title`}
        style={{
          position: "fixed",
          top: panelStyle?.top ?? -9999,
          left: panelStyle?.left ?? VIEWPORT_MARGIN,
          width: PANEL_WIDTH,
          maxHeight: panelStyle?.maxHeight ?? "calc(100vh - 2rem)",
          zIndex: 200,
          visibility: panelStyle ? "visible" : "hidden",
        }}
        className="overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-xl ring-1 ring-black/5"
      >
        <h2
          id={`${panelId}-title`}
          className="text-base font-semibold text-zinc-950"
        >
          How Job Hunter works
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          {description}
        </p>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Quick start
        </p>
        <ol className="mt-3 space-y-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white"
              >
                {index + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-zinc-900">
                  {step.title}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-zinc-600">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    ) : null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="dialog"
        aria-label="How Job Hunter works"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-300/80 bg-white text-base font-semibold leading-none text-zinc-600 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
      >
        ?
      </button>

      {panel && mounted ? createPortal(panel, document.body) : null}
    </div>
  );
}
