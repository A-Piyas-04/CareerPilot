import {
  ALLOWED_ACTION_HREFS,
  ALLOWED_NUDGE_TYPES,
  type AiNudge,
  type AiNudgeActionHref,
  type AiNudgeType,
} from "@/lib/reminders/types";

type RawNudge = Record<string, unknown>;

export function parseNudgesJson(rawText: string): AiNudge[] {
  const parsed = JSON.parse(stripCodeFence(rawText)) as { nudges?: unknown };

  if (!Array.isArray(parsed.nudges)) {
    throw new Error("Nudge response must include a nudges array.");
  }

  return parsed.nudges
    .map(normalizeNudge)
    .filter((nudge): nudge is AiNudge => nudge !== null)
    .slice(0, 3);
}

export function stripCodeFence(rawText: string) {
  const trimmed = rawText.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

function normalizeNudge(value: unknown): AiNudge | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = stringValue(value.title);
  const message = stringValue(value.message);

  if (!title || !message) {
    return null;
  }

  const type = nudgeType(value.type);
  const actionHref = actionHrefValue(value.actionHref);
  const actionLabel = stringValue(value.actionLabel) || defaultActionLabel(actionHref);
  const id = stringValue(value.id) || `${type}-${hashText(`${title}:${message}`)}`;

  return {
    actionHref,
    actionLabel,
    id,
    message,
    title,
    type,
  };
}

function nudgeType(value: unknown): AiNudgeType {
  return ALLOWED_NUDGE_TYPES.includes(value as AiNudgeType)
    ? (value as AiNudgeType)
    : "general";
}

function actionHrefValue(value: unknown): AiNudgeActionHref {
  return ALLOWED_ACTION_HREFS.includes(value as AiNudgeActionHref)
    ? (value as AiNudgeActionHref)
    : "/dashboard";
}

function defaultActionLabel(href: AiNudgeActionHref) {
  if (href === "/jobs") return "Open Jobs";
  if (href === "/tracker") return "Open Tracker";
  if (href === "/goals") return "Open Goals";
  if (href === "/calendar") return "Open Calendar";
  if (href === "/roadmap") return "Open Roadmaps";
  return "Open Dashboard";
}

function isRecord(value: unknown): value is RawNudge {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}
