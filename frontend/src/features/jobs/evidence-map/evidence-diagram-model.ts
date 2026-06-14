import type {
  EvidenceMapRow,
  EvidenceMapStatus,
  EvidenceMapSummary,
} from "@/features/jobs/types";

export const GHOST_SECTION_ID = "ghost-not-in-cv";

export const FLOW_WIDTH = 1000;
export const FLOW_REQ_X = 40;
export const FLOW_REQ_W = 320;
export const FLOW_SEC_W = 260;
export const FLOW_SEC_X = FLOW_WIDTH - 40 - FLOW_SEC_W;
export const FLOW_ROW_H = 52;
export const FLOW_PILL_H = 36;
export const FLOW_PAD_TOP = 72;
export const FLOW_PAD_BOTTOM = 56;

export type FlowRequirement = {
  rowId: string;
  label: string;
  status: EvidenceMapStatus;
  similarity: number;
  y: number;
  rowIndex: number;
};

export type FlowSection = {
  id: string;
  label: string;
  isGhost: boolean;
  citationCount: number;
  y: number;
};

export type FlowBand = {
  id: string;
  rowId: string;
  sectionId: string;
  status: EvidenceMapStatus;
  similarity: number;
  endOffset: number;
};

export type BipartiteFlowData = {
  requirements: FlowRequirement[];
  sections: FlowSection[];
  bands: FlowBand[];
  width: number;
  height: number;
};

const STATUS_ORDER: Record<EvidenceMapStatus, number> = {
  strong: 0,
  weak: 1,
  missing: 2,
};

export function sortRequirements(rows: EvidenceMapRow[]): EvidenceMapRow[] {
  return [...rows].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return b.top_similarity - a.top_similarity;
  });
}

export function filterRows(
  rows: EvidenceMapRow[],
  filter: "all" | EvidenceMapStatus,
): EvidenceMapRow[] {
  if (filter === "all") return rows;
  return rows.filter((r) => r.status === filter);
}

export function truncateLabel(label: string, max = 44): string {
  const trimmed = label.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function rowCenterY(index: number): number {
  return FLOW_PAD_TOP + index * FLOW_ROW_H + FLOW_ROW_H / 2;
}

function spreadSectionYs(
  targets: { id: string; targetY: number }[],
  minY: number,
  maxY: number,
): Map<string, number> {
  if (!targets.length) return new Map();
  const minSep = 44;
  const sorted = [...targets].sort((a, b) => a.targetY - b.targetY);
  const raw: { id: string; y: number }[] = [];

  let prev = minY - minSep;
  for (const item of sorted) {
    const y = Math.max(item.targetY, prev + minSep);
    raw.push({ id: item.id, y });
    prev = y;
  }

  const overflow = raw[raw.length - 1].y - maxY;
  const map = new Map<string, number>();
  if (overflow <= 0) {
    for (const item of raw) map.set(item.id, item.y);
    return map;
  }

  const span = raw[raw.length - 1].y - raw[0].y || 1;
  const avail = maxY - minY;
  for (let i = 0; i < raw.length; i++) {
    const t = raw.length === 1 ? 0.5 : i / (raw.length - 1);
    const base = raw[0].y + t * span;
    const compressed = minY + ((base - raw[0].y) / span) * avail;
    map.set(raw[i].id, compressed);
  }
  return map;
}

export function bipartiteFlowData(
  rows: EvidenceMapRow[],
  filter: "all" | EvidenceMapStatus,
): BipartiteFlowData {
  const sorted = sortRequirements(filterRows(rows, filter));
  const n = sorted.length;

  const requirements: FlowRequirement[] = sorted.map((row, i) => ({
    rowId: row.id,
    label: row.label,
    status: row.status,
    similarity: row.top_similarity,
    y: rowCenterY(i),
    rowIndex: i,
  }));

  const reqByRowId = new Map(requirements.map((r) => [r.rowId, r]));

  type SectionAcc = {
    id: string;
    sectionName: string;
    isGhost: boolean;
    citationCount: number;
    rowIndices: number[];
  };

  const sectionMap = new Map<string, SectionAcc>();
  const bands: FlowBand[] = [];

  for (const row of sorted) {
    const req = reqByRowId.get(row.id);
    if (!req) continue;

    if (row.evidence_chunks.length === 0) {
      const key = GHOST_SECTION_ID;
      let acc = sectionMap.get(key);
      if (!acc) {
        acc = {
          id: key,
          sectionName: "Not in CV",
          isGhost: true,
          citationCount: 0,
          rowIndices: [],
        };
        sectionMap.set(key, acc);
      }
      acc.citationCount += 1;
      acc.rowIndices.push(req.rowIndex);
      bands.push({
        id: `band-${row.id}-ghost`,
        rowId: row.id,
        sectionId: key,
        status: row.status,
        similarity: row.top_similarity,
        endOffset: 0,
      });
      continue;
    }

    const seen = new Set<string>();
    for (const chunk of row.evidence_chunks) {
      const sectionName = chunk.section_name || "CV section";
      if (seen.has(sectionName)) continue;
      seen.add(sectionName);

      let acc = sectionMap.get(sectionName);
      if (!acc) {
        acc = {
          id: sectionName,
          sectionName,
          isGhost: false,
          citationCount: 0,
          rowIndices: [],
        };
        sectionMap.set(sectionName, acc);
      }
      acc.citationCount += 1;
      acc.rowIndices.push(req.rowIndex);

      const bestSim = Math.max(
        ...row.evidence_chunks
          .filter((c) => (c.section_name || "CV section") === sectionName)
          .map((c) => c.similarity),
      );

      bands.push({
        id: `band-${row.id}-${sectionName}`,
        rowId: row.id,
        sectionId: sectionName,
        status: row.status,
        similarity: bestSim,
        endOffset: 0,
      });
    }
  }

  const sectionList = [...sectionMap.values()].sort((a, b) => {
    const meanA = a.rowIndices.reduce((s, i) => s + i, 0) / a.rowIndices.length;
    const meanB = b.rowIndices.reduce((s, i) => s + i, 0) / b.rowIndices.length;
    return meanA - meanB;
  });

  const reqMinY = n > 0 ? rowCenterY(0) : FLOW_PAD_TOP;
  const reqMaxY = n > 0 ? rowCenterY(n - 1) : FLOW_PAD_TOP;

  const sectionTargets = sectionList.map((sec) => {
    const mean =
      sec.rowIndices.reduce((s, i) => s + i, 0) / Math.max(sec.rowIndices.length, 1);
    return { id: sec.id, targetY: rowCenterY(mean) };
  });

  const sectionYs = spreadSectionYs(sectionTargets, reqMinY, reqMaxY);

  const sections: FlowSection[] = sectionList.map((sec) => ({
    id: sec.id,
    label: sec.sectionName,
    isGhost: sec.isGhost,
    citationCount: sec.citationCount,
    y: sectionYs.get(sec.id) ?? reqMinY,
  }));

  const bandsBySection = new Map<string, FlowBand[]>();
  for (const band of bands) {
    const list = bandsBySection.get(band.sectionId) ?? [];
    list.push(band);
    bandsBySection.set(band.sectionId, list);
  }
  for (const list of bandsBySection.values()) {
    list.sort((a, b) => {
      const ra = reqByRowId.get(a.rowId)?.rowIndex ?? 0;
      const rb = reqByRowId.get(b.rowId)?.rowIndex ?? 0;
      return ra - rb;
    });
    list.forEach((band, i) => {
      band.endOffset = (i - (list.length - 1) / 2) * 6;
    });
  }

  const height = Math.max(
    FLOW_PAD_TOP + n * FLOW_ROW_H + FLOW_PAD_BOTTOM,
    FLOW_PAD_TOP + sectionList.length * 44 + FLOW_PAD_BOTTOM,
    360,
  );

  return { requirements, sections, bands, width: FLOW_WIDTH, height };
}

export function statusStroke(status: EvidenceMapStatus): string {
  if (status === "strong") return "#059669";
  if (status === "weak") return "#d97706";
  return "#e11d48";
}

export function statusFill(status: EvidenceMapStatus): string {
  if (status === "strong") return "var(--cp-diagram-strong-fill)";
  if (status === "weak") return "var(--cp-diagram-weak-fill)";
  return "var(--cp-diagram-gap-fill)";
}

export function statusLabel(status: EvidenceMapStatus): string {
  if (status === "strong") return "Strong";
  if (status === "weak") return "Weak";
  return "Gap";
}

export function fitTierColor(fitScore: number): { stroke: string; fill: string; text: string } {
  if (fitScore >= 75) {
    return { stroke: "#059669", fill: "#ecfdf5", text: "#14532d" };
  }
  if (fitScore >= 50) {
    return { stroke: "#2563eb", fill: "#eff6ff", text: "#1e3a8a" };
  }
  return { stroke: "#ca8a04", fill: "#fffbeb", text: "#713f12" };
}

export function legendFromSummary(summary: EvidenceMapSummary) {
  return {
    strong: summary.strong_count,
    weak: summary.weak_count,
    missing: summary.missing_count,
    grounded: `${summary.strong_count}/${summary.total_requirements}`,
  };
}

export function flowBandPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const c1x = x1 + dx * 0.42;
  const c2x = x1 + dx * 0.58;
  return `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;
}
