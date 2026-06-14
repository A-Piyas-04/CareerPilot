"use client";

import { useEffect, useMemo, useState } from "react";

import type { EvidenceMapFilter, EvidenceMapRow } from "@/features/jobs/types";

import { DiagramCanvas } from "./DiagramCanvas";
import {
  FLOW_PAD_BOTTOM,
  FLOW_PAD_TOP,
  FLOW_PILL_H,
  FLOW_REQ_W,
  FLOW_REQ_X,
  FLOW_SEC_W,
  FLOW_SEC_X,
  bipartiteFlowData,
  flowBandPath,
  statusFill,
  statusLabel,
  statusStroke,
  truncateLabel,
  type BipartiteFlowData,
  type FlowBand,
  type FlowRequirement,
  type FlowSection,
} from "./evidence-diagram-model";

type Props = {
  rows: EvidenceMapRow[];
  fitScore: number;
  filter: EvidenceMapFilter;
  selectedRowId: string | null;
  onSelectRow: (rowId: string | null) => void;
};

function FlowBands({
  bands,
  reqById,
  secById,
  activeRowId,
  focusedSectionIds,
}: {
  bands: FlowBand[];
  reqById: Map<string, FlowRequirement>;
  secById: Map<string, FlowSection>;
  activeRowId: string | null;
  focusedSectionIds: Set<string>;
}) {
  const x1 = FLOW_REQ_X + FLOW_REQ_W;
  const x2 = FLOW_SEC_X;

  return (
    <g aria-hidden>
      {bands.map((band) => {
        const req = reqById.get(band.rowId);
        const sec = secById.get(band.sectionId);
        if (!req || !sec) return null;

        const active = !activeRowId || activeRowId === band.rowId;
        const stroke = band.status === "missing" ? "#94a3b8" : statusStroke(band.status);
        const sw = Math.min(3.5, 1.4 + band.similarity * 2.2);
        const dash = band.status === "missing" ? "6 5" : band.status === "weak" ? "8 4" : undefined;
        const isFocusedBand = !activeRowId || (active && focusedSectionIds.has(band.sectionId));
        const inFocusMode = activeRowId !== null;
        const opacity = inFocusMode ? (isFocusedBand ? 0.98 : 0.015) : 0.22;
        const lineWidth = inFocusMode ? (isFocusedBand ? sw + 1.1 : 0.85) : sw;
        const filter = inFocusMode
          ? isFocusedBand
            ? `drop-shadow(0 0 2px ${stroke})`
            : "blur(3px) saturate(0.2)"
          : undefined;

        return (
          <path
            key={band.id}
            d={flowBandPath(x1, req.y, x2, sec.y + band.endOffset)}
            fill="none"
            stroke={stroke}
            strokeWidth={lineWidth}
            strokeDasharray={dash}
            strokeLinecap="round"
            opacity={opacity}
            className="cp-diagram-bond"
            style={{ pointerEvents: "none", filter }}
          />
        );
      })}
    </g>
  );
}

function RequirementRow({
  req,
  selected,
  hovered,
  dimmed,
  focused,
  onSelect,
  onHover,
}: {
  req: FlowRequirement;
  selected: boolean;
  hovered: boolean;
  dimmed: boolean;
  focused: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const stroke = statusStroke(req.status);
  const fill = statusFill(req.status);
  const y = req.y - FLOW_PILL_H / 2;
  const active = selected || hovered;
  const simPct = Math.round(req.similarity * 100);

  return (
    <g
      data-diagram-node
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(req.rowId);
      }}
      onMouseEnter={() => onHover(req.rowId)}
      onMouseLeave={() => onHover(null)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(req.rowId);
        }
      }}
      style={{
        opacity: dimmed ? 0.28 : 1,
        filter: dimmed ? "blur(1.8px)" : undefined,
        transition: "opacity 160ms ease, filter 160ms ease",
      }}
    >
      <title>{req.label}</title>

      {active || focused ? (
        <rect
          x={FLOW_REQ_X - 4}
          y={y - 4}
          width={FLOW_REQ_W + 8}
          height={FLOW_PILL_H + 8}
          rx={12}
          fill={stroke}
          fillOpacity={0.08}
          stroke={stroke}
          strokeWidth={1.5}
          style={{ pointerEvents: "none" }}
        />
      ) : null}

      <rect
        x={FLOW_REQ_X}
        y={y}
        width={FLOW_REQ_W}
        height={FLOW_PILL_H}
        rx={10}
        fill={fill}
        stroke={stroke}
        strokeWidth={selected ? 2 : 1}
      />
      <rect
        x={FLOW_REQ_X}
        y={y}
        width={5}
        height={FLOW_PILL_H}
        rx={2}
        fill={stroke}
        style={{ pointerEvents: "none" }}
      />

      <text
        x={FLOW_REQ_X + 16}
        y={req.y + 1}
        dominantBaseline="middle"
        fill="var(--cp-text-primary)"
        fontSize={13}
        fontWeight="600"
        fontFamily="inherit"
        style={{ pointerEvents: "none" }}
      >
        {truncateLabel(req.label)}
      </text>

      <text
        x={FLOW_REQ_X + FLOW_REQ_W - 12}
        y={req.y + 1}
        textAnchor="end"
        dominantBaseline="middle"
        fill={stroke}
        fontSize={10}
        fontWeight="700"
        fontFamily="inherit"
        style={{ pointerEvents: "none" }}
      >
        {req.status === "missing" ? statusLabel(req.status) : `${simPct}%`}
      </text>
    </g>
  );
}

function SectionRow({ sec, dimmed }: { sec: FlowSection; dimmed: boolean }) {
  const y = sec.y - FLOW_PILL_H / 2;
  const fill = sec.isGhost ? "var(--cp-surface-muted)" : "#eff6ff";
  const stroke = sec.isGhost ? "#94a3b8" : "#2563eb";

  return (
    <g
      style={{
        pointerEvents: "none",
        opacity: dimmed ? 0.28 : 1,
        filter: dimmed ? "blur(1.8px)" : undefined,
        transition: "opacity 160ms ease, filter 160ms ease",
      }}
    >
      <rect
        x={FLOW_SEC_X}
        y={y}
        width={FLOW_SEC_W}
        height={FLOW_PILL_H}
        rx={10}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
        strokeDasharray={sec.isGhost ? "5 4" : undefined}
      />
      <circle cx={FLOW_SEC_X} cy={sec.y} r={5} fill={stroke} />
      <text
        x={FLOW_SEC_X + 14}
        y={sec.y - (sec.isGhost ? 0 : 5)}
        dominantBaseline="middle"
        fill="var(--cp-text-primary)"
        fontSize={12}
        fontWeight="600"
        fontFamily="inherit"
      >
        {truncateLabel(sec.label, 36)}
      </text>
      {!sec.isGhost ? (
        <text
          x={FLOW_SEC_X + 14}
          y={sec.y + 11}
          dominantBaseline="middle"
          fill="var(--cp-text-muted)"
          fontSize={9}
          fontFamily="inherit"
        >
          {sec.citationCount} requirement{sec.citationCount === 1 ? "" : "s"}
        </text>
      ) : null}
    </g>
  );
}

function BipartiteFlowDiagram({
  data,
  selectedRowId,
  focusedRowId,
  hoveredRowId,
  onSelectRow,
  onFocusRow,
  onHoverRow,
}: {
  data: BipartiteFlowData;
  selectedRowId: string | null;
  focusedRowId: string | null;
  hoveredRowId: string | null;
  onSelectRow: (rowId: string | null) => void;
  onFocusRow: (rowId: string | null) => void;
  onHoverRow: (rowId: string | null) => void;
}) {
  const { width, height } = data;

  const reqById = useMemo(
    () => new Map(data.requirements.map((r) => [r.rowId, r])),
    [data.requirements],
  );
  const secById = useMemo(
    () => new Map(data.sections.map((s) => [s.id, s])),
    [data.sections],
  );

  const activeRowId = hoveredRowId ?? selectedRowId;
  const focusedSectionIds = useMemo(() => {
    if (!focusedRowId) return new Set<string>();
    return new Set(
      data.bands
        .filter((band) => band.rowId === focusedRowId)
        .map((band) => band.sectionId),
    );
  }, [data.bands, focusedRowId]);
  const midX = (FLOW_REQ_X + FLOW_REQ_W + FLOW_SEC_X) / 2;

  return (
    <>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="var(--cp-surface)"
        data-diagram-pan
        onClick={() => onFocusRow(null)}
      />

      <text
        x={FLOW_REQ_X}
        y={36}
        fill="var(--cp-text-muted)"
        fontSize={10}
        fontWeight="700"
        letterSpacing="0.14em"
        fontFamily="inherit"
        style={{ pointerEvents: "none" }}
      >
        JOB REQUIREMENTS
      </text>
      <text
        x={FLOW_SEC_X + FLOW_SEC_W}
        y={36}
        textAnchor="end"
        fill="var(--cp-text-muted)"
        fontSize={10}
        fontWeight="700"
        letterSpacing="0.14em"
        fontFamily="inherit"
        style={{ pointerEvents: "none" }}
      >
        CV EVIDENCE
      </text>

      <line
        x1={midX}
        y1={FLOW_PAD_TOP - 12}
        x2={midX}
        y2={height - FLOW_PAD_BOTTOM + 12}
        stroke="var(--cp-border)"
        strokeWidth={1}
        strokeDasharray="4 8"
        opacity={0.35}
        style={{ pointerEvents: "none" }}
      />

      {data.requirements.map((req) => (
        <line
          key={`guide-${req.rowId}`}
          x1={FLOW_REQ_X}
          y1={req.y}
          x2={FLOW_SEC_X + FLOW_SEC_W}
          y2={req.y}
          stroke="var(--cp-border)"
          strokeWidth={0.5}
          opacity={activeRowId === req.rowId ? 0.35 : 0.12}
          style={{ pointerEvents: "none" }}
        />
      ))}

      <FlowBands
        bands={data.bands}
        reqById={reqById}
        secById={secById}
        activeRowId={activeRowId}
        focusedSectionIds={focusedSectionIds}
      />

      {data.sections.map((sec) => (
        <SectionRow
          key={sec.id}
          sec={sec}
          dimmed={focusedRowId !== null && !focusedSectionIds.has(sec.id)}
        />
      ))}

      {data.requirements.map((req) => (
        <RequirementRow
          key={req.rowId}
          req={req}
          selected={selectedRowId === req.rowId}
          hovered={hoveredRowId === req.rowId}
          focused={focusedRowId === req.rowId}
          dimmed={focusedRowId !== null && focusedRowId !== req.rowId}
          onSelect={(rowId) => {
            onSelectRow(rowId);
            onFocusRow(focusedRowId === rowId ? null : rowId);
          }}
          onHover={onHoverRow}
        />
      ))}

      <g transform={`translate(${FLOW_REQ_X}, ${height - 28})`} style={{ pointerEvents: "none" }}>
        <LegendItem x={0} color="#059669" label="Strong" />
        <LegendItem x={88} color="#d97706" label="Weak" />
        <LegendItem x={155} color="#e11d48" label="Gap" />
        <LegendItem x={210} color="#2563eb" label="CV section" />
      </g>
    </>
  );
}

function LegendItem({ x, color, label }: { x: number; color: string; label: string }) {
  return (
    <g transform={`translate(${x}, 0)`}>
      <circle cx={0} cy={0} r={4.5} fill={color} />
      <text x={10} y={4} fill="var(--cp-text-muted)" fontSize={10} fontWeight="600" fontFamily="inherit">
        {label}
      </text>
    </g>
  );
}

export function EvidenceElementDiagram({
  rows,
  fitScore: _fitScore,
  filter,
  selectedRowId,
  onSelectRow,
}: Props) {
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);
  const data = useMemo(() => bipartiteFlowData(rows, filter), [rows, filter]);

  useEffect(() => {
    if (!focusedRowId) return;
    const exists = rows.some((row) => row.id === focusedRowId);
    if (!exists || selectedRowId === null) {
      setFocusedRowId(null);
    }
  }, [rows, selectedRowId, focusedRowId]);

  const displayHeight = Math.min(Math.max(560, data.height * 0.86), 780);

  return (
    <DiagramCanvas
      title="Evidence flow map"
      subtitle="Each row is a job requirement — bands show where your CV supports it"
      viewW={data.width}
      viewH={data.height}
      displayH={displayHeight}
    >
      <BipartiteFlowDiagram
        data={data}
        selectedRowId={selectedRowId}
        focusedRowId={focusedRowId}
        hoveredRowId={hoveredRowId}
        onSelectRow={onSelectRow}
        onFocusRow={setFocusedRowId}
        onHoverRow={setHoveredRowId}
      />
    </DiagramCanvas>
  );
}
