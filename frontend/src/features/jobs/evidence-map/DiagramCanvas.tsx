"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type PZ = { tx: number; ty: number; scale: number };

type Props = {
  title: string;
  subtitle?: string;
  viewW: number;
  viewH: number;
  displayH?: number;
  children: ReactNode;
  className?: string;
};

function safe(n: number, fallback = 0): number {
  return Number.isFinite(n) ? n : fallback;
}

function isPanTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest("[data-diagram-node]")) return false;
  return target.closest("[data-diagram-pan]") !== null || target.tagName === "svg";
}

export function DiagramCanvas({
  title,
  subtitle,
  viewW,
  viewH,
  displayH = 520,
  children,
  className = "",
}: Props) {
  const [pz, setPz] = useState<PZ>({ tx: 0, ty: 0, scale: 1 });
  const [grabbing, setGrabbing] = useState(false);
  const dragging = useRef(false);
  const dragOrigin = useRef<{ px: number; py: number; tx: number; ty: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const svgRatio = useCallback(() => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 1;
    return viewW / rect.width;
  }, [viewW]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0) return;
      const ratio = viewW / rect.width;
      const mx = (e.clientX - rect.left) * ratio;
      const my = (e.clientY - rect.top) * ratio;
      const factor = e.deltaY < 0 ? 1.14 : 0.88;
      setPz((prev) => {
        const s2 = Math.max(0.2, Math.min(5, prev.scale * factor));
        const r = s2 / prev.scale;
        return {
          scale: s2,
          tx: safe(mx * (1 - r) + prev.tx * r),
          ty: safe(my * (1 - r) + prev.ty * r),
        };
      });
    },
    [viewW],
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const stopDrag = useCallback(() => {
    dragging.current = false;
    setGrabbing(false);
    dragOrigin.current = null;
  }, []);

  const onPointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragging.current || !dragOrigin.current) return;
      const r = svgRatio();
      const dx = (clientX - dragOrigin.current.px) * r;
      const dy = (clientY - dragOrigin.current.py) * r;
      const origin = dragOrigin.current;
      setPz((prev) => ({
        ...prev,
        tx: safe(origin.tx + dx),
        ty: safe(origin.ty + dy),
      }));
    },
    [svgRatio],
  );

  useEffect(() => {
    if (!grabbing) return;

    const onWindowMove = (e: globalThis.PointerEvent) => {
      onPointerMove(e.clientX, e.clientY);
    };
    const onWindowUp = () => stopDrag();

    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", onWindowUp);
    window.addEventListener("pointercancel", onWindowUp);

    return () => {
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", onWindowUp);
      window.removeEventListener("pointercancel", onWindowUp);
    };
  }, [grabbing, onPointerMove, stopDrag]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      if (!isPanTarget(e.target)) return;

      e.preventDefault();
      dragging.current = true;
      setGrabbing(true);
      dragOrigin.current = { px: e.clientX, py: e.clientY, tx: pz.tx, ty: pz.ty };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [pz.tx, pz.ty],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      stopDrag();
    },
    [stopDrag],
  );

  const zoom = (f: number) =>
    setPz((p) => {
      const cx = viewW / 2;
      const cy = viewH / 2;
      const s2 = Math.max(0.2, Math.min(5, p.scale * f));
      const r = s2 / p.scale;
      return {
        scale: s2,
        tx: safe(cx * (1 - r) + p.tx * r),
        ty: safe(cy * (1 - r) + p.ty * r),
      };
    });

  const reset = () => setPz({ tx: 0, ty: 0, scale: 1 });

  const transform = `translate(${safe(pz.tx)},${safe(pz.ty)}) scale(${safe(pz.scale, 1)})`;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-surface)] shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-[var(--cp-border)] px-5 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] text-[var(--cp-text-muted)]">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <CtrlBtn onClick={() => zoom(1.3)}>＋</CtrlBtn>
          <CtrlBtn onClick={() => zoom(0.77)}>－</CtrlBtn>
          <CtrlBtn onClick={reset}>Reset</CtrlBtn>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="relative overflow-hidden overscroll-contain"
        style={{ height: displayH, touchAction: "none" }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewW} ${viewH}`}
          className="h-full w-full select-none"
          style={{ cursor: grabbing ? "grabbing" : "grab", display: "block" }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label={title}
        >
          <g transform={transform}>{children}</g>
        </svg>
        <p className="pointer-events-none absolute bottom-2 right-3 select-none text-[10px] text-[var(--cp-text-muted)] opacity-60">
          scroll to zoom · drag background to pan
        </p>
      </div>
    </div>
  );
}

function CtrlBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-w-[32px] rounded-md px-2 py-1 text-xs font-semibold text-[var(--cp-text-secondary)] ring-1 ring-[var(--cp-border)] hover:bg-[var(--cp-surface-muted)]"
    >
      {children}
    </button>
  );
}
