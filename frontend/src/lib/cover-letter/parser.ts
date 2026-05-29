export function parseCoverLetterJson(rawResponse: string) {
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

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed) ||
    typeof (parsed as Record<string, unknown>).content !== "string"
  ) {
    throw new Error("The AI response did not include cover letter content.");
  }

  const content = (parsed as { content: string }).content.trim();

  if (!content) {
    throw new Error("The generated cover letter was empty.");
  }

  return { content };
}

function stripCodeFences(value: string) {
  return value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}
