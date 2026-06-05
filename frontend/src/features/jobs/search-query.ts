const LEADING_FILLER =
  /^(?:find|get|show|search|look\s+for|looking\s+for|help\s+me\s+find|can\s+you\s+find|i\s+want|i\s+am\s+looking\s+for)\s+(?:me\s+)?/i;

const DATE_FILLER =
  /\b(?:open|available|posted|hiring)\s+(?:this|next)\s+(?:week|month)\b|\b(?:this|next)\s+(?:week|month)\b/gi;

const TRAILING_JOB_WORDS = /\b(?:jobs?|roles?|positions?|openings?)\b/gi;

const ROLE_SYNONYMS: Array<[RegExp, string]> = [
  [/\bml\b/gi, "machine learning"],
  [/\bai\b/gi, "artificial intelligence"],
  [/\bbackend\s+dev\b/gi, "backend developer"],
  [/\bserver\s+dev\b/gi, "backend developer"],
  [/\bfrontend\s+dev\b/gi, "frontend developer"],
  [/\bfullstack\b/gi, "full stack"],
  [/\bdata\s+sci\b/gi, "data science"],
];

type NormalizeInput = {
  query: string;
  location?: string;
};

export type NormalizedJobSearch = {
  query: string;
  location?: string;
};

export function normalizeJobSearchInput({
  query,
  location,
}: NormalizeInput): NormalizedJobSearch {
  let normalizedQuery = query.trim().replace(/\s+/g, " ");
  let normalizedLocation = location?.trim() || undefined;

  normalizedQuery = normalizedQuery.replace(LEADING_FILLER, "");

  if (!normalizedLocation) {
    const locationMatch = normalizedQuery.match(
      /\bin\s+([a-z][a-z\s.'-]{1,60}?)(?=\s+(?:open|available|posted|hiring|this|next|remote|hybrid|onsite|on-site)\b|$)/i,
    );
    if (locationMatch?.[1]) {
      normalizedLocation = cleanLocation(locationMatch[1]);
      normalizedQuery = [
        normalizedQuery.slice(0, locationMatch.index),
        normalizedQuery.slice((locationMatch.index ?? 0) + locationMatch[0].length),
      ]
        .join(" ")
        .trim();
    }
  }

  normalizedQuery = normalizedQuery
    .replace(DATE_FILLER, "")
    .replace(TRAILING_JOB_WORDS, "")
    .replace(/\s+/g, " ")
    .trim();

  for (const [pattern, replacement] of ROLE_SYNONYMS) {
    normalizedQuery = normalizedQuery.replace(pattern, replacement);
  }

  normalizedQuery = normalizedQuery.replace(/\s+/g, " ").trim();

  return {
    query: normalizedQuery || query.trim(),
    location: normalizedLocation,
  };
}

function cleanLocation(value: string) {
  return value
    .replace(DATE_FILLER, "")
    .replace(/\s+/g, " ")
    .replace(/[,.]$/, "")
    .trim();
}
