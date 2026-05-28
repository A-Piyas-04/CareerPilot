import type { RoadmapResource } from "@/lib/roadmap/types";

type GeneratedRoadmapItem = {
  week_number: number;
  title: string;
  description: string;
  resources: RoadmapResource[];
};

export type ParsedRoadmapGeneration = {
  overview: string;
  items: GeneratedRoadmapItem[];
};

export function parseRoadmapJson(
  rawResponse: string,
  durationWeeks: number,
): ParsedRoadmapGeneration {
  const cleaned = stripCodeFences(rawResponse).trim();

  if (!cleaned) {
    throw new Error("The AI response was empty.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("The AI response was not valid JSON.");
  }

  if (!isObject(parsed)) {
    throw new Error("The AI response did not contain a roadmap object.");
  }

  const overview =
    typeof parsed.overview === "string" ? parsed.overview.trim() : "";
  const rawItems = Array.isArray(parsed.items) ? parsed.items : null;

  if (!rawItems) {
    throw new Error("The roadmap response did not include weekly items.");
  }

  if (rawItems.length !== durationWeeks) {
    throw new Error(
      `The roadmap must include exactly ${durationWeeks} weekly items.`,
    );
  }

  const items = rawItems.map((item, index) =>
    normalizeGeneratedItem(item, index + 1),
  );

  return {
    overview,
    items,
  };
}

export function stripCodeFences(value: string) {
  return value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function normalizeGeneratedItem(
  value: unknown,
  fallbackWeekNumber: number,
): GeneratedRoadmapItem {
  if (!isObject(value)) {
    throw new Error(`Week ${fallbackWeekNumber} is not a valid object.`);
  }

  const weekNumber =
    typeof value.week_number === "number" && Number.isFinite(value.week_number)
      ? value.week_number
      : fallbackWeekNumber;
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const description =
    typeof value.description === "string" ? value.description.trim() : "";

  if (!title || !description) {
    throw new Error(`Week ${fallbackWeekNumber} needs a title and description.`);
  }

  return {
    week_number: weekNumber,
    title,
    description,
    resources: normalizeResources(value.resources),
  };
}

function normalizeResources(value: unknown): RoadmapResource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((resource) => {
      if (typeof resource === "string") {
        return { name: resource.trim() };
      }

      if (!isObject(resource) || typeof resource.name !== "string") {
        return null;
      }

      const name = resource.name.trim();
      const url = typeof resource.url === "string" ? resource.url.trim() : "";

      if (!name) {
        return null;
      }

      return url ? { name, url } : { name };
    })
    .filter((resource): resource is RoadmapResource => resource !== null)
    .slice(0, 5);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
