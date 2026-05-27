import { createGeminiText, GeminiApiError } from "@/lib/gemini";

export type AssistantIntent =
  | "readiness_check"
  | "skill_gap"
  | "roadmap_generation"
  | "cover_letter"
  | "general";

export type IntentDetectionMethod = "rule" | "model" | "fallback";

export type IntentDetectionResult = {
  confidence: number;
  intent: AssistantIntent;
  matchedPattern?: string;
  method: IntentDetectionMethod;
  reason?: string;
};

const INTENTS: AssistantIntent[] = [
  "readiness_check",
  "skill_gap",
  "roadmap_generation",
  "cover_letter",
  "general",
];

export async function detectAssistantIntent(
  message: string,
): Promise<IntentDetectionResult> {
  const ruleResult = detectRuleIntent(message);

  if (ruleResult) {
    return ruleResult;
  }

  try {
    return await classifyIntentWithGemini(message);
  } catch (error) {
    return {
      confidence: 0,
      intent: "general",
      method: "fallback",
      reason:
        error instanceof GeminiApiError || error instanceof Error
          ? error.message
          : "Intent classification failed.",
    };
  }
}

export function detectRuleIntent(
  message: string,
): IntentDetectionResult | null {
  const normalized = normalizeMessage(message);
  const patternGroups: Array<{
    intent: AssistantIntent;
    patterns: RegExp[];
  }> = [
    { intent: "cover_letter", patterns: COVER_LETTER_PATTERNS },
    { intent: "roadmap_generation", patterns: ROADMAP_PATTERNS },
    { intent: "readiness_check", patterns: READINESS_PATTERNS },
    { intent: "skill_gap", patterns: SKILL_GAP_PATTERNS },
  ];

  for (const group of patternGroups) {
    const matchedPattern = group.patterns.find((pattern) =>
      pattern.test(normalized),
    );

    if (matchedPattern) {
      return {
        confidence: 1,
        intent: group.intent,
        matchedPattern: matchedPattern.source,
        method: "rule",
      };
    }
  }

  return null;
}

export async function classifyIntentWithGemini(
  message: string,
): Promise<IntentDetectionResult> {
  const rawText = await createGeminiText({
    maxOutputTokens: 120,
    prompt: `Classify this user message:\n\n${message}`,
    systemPrompt: INTENT_CLASSIFIER_PROMPT,
    temperature: 0,
  });
  const parsed = parseIntentClassifierResponse(rawText);

  return {
    confidence: parsed.confidence,
    intent: parsed.intent,
    method: "model",
    reason: parsed.reason,
  };
}

function parseIntentClassifierResponse(rawText: string) {
  const data = JSON.parse(rawText) as {
    confidence?: unknown;
    intent?: unknown;
    reason?: unknown;
  };
  const intent =
    typeof data.intent === "string" && isAssistantIntent(data.intent)
      ? data.intent
      : "general";
  const confidence =
    typeof data.confidence === "number" && Number.isFinite(data.confidence)
      ? clamp(data.confidence, 0, 1)
      : 0.5;
  const reason = typeof data.reason === "string" ? data.reason : undefined;

  return { confidence, intent, reason };
}

function isAssistantIntent(value: string): value is AssistantIntent {
  return INTENTS.includes(value as AssistantIntent);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeMessage(message: string) {
  return message.toLowerCase().replace(/\s+/g, " ").trim();
}

const READINESS_PATTERNS = [
  /\bam i ready\b/,
  /\bcan i apply\b/,
  /\bam i qualified\b/,
];

const SKILL_GAP_PATTERNS = [
  /\bskills? am i missing\b/,
  /\bmissing skills?\b/,
  /\bwhat.*should i learn\b/,
  /\bskill gaps?\b/,
];

const ROADMAP_PATTERNS = [
  /\broadmap\b/,
  /\blearning plan\b/,
  /\bstudy plan\b/,
  /\b\d+\s*[- ]?(week|month)s?\s+plan\b/,
];

const COVER_LETTER_PATTERNS = [
  /\bcover letter\b/,
  /\bdraft a cover letter\b/,
  /\bwrite a cover letter\b/,
  /\bgenerate a cover letter\b/,
];

const INTENT_CLASSIFIER_PROMPT = `You classify CareerPilot assistant messages.

Return JSON only with this exact shape:
{
  "intent": "readiness_check" | "skill_gap" | "roadmap_generation" | "cover_letter" | "general",
  "confidence": number,
  "reason": string
}

Labels:
- readiness_check: The user asks whether they are ready, qualified, close enough, or able to apply for a role.
- skill_gap: The user asks what skills, knowledge, gaps, or learning priorities they need for a role.
- roadmap_generation: The user asks for a roadmap, plan, schedule, weekly/monthly path, or becoming-something plan.
- cover_letter: The user asks for a cover letter, professional application letter, or letter to apply to a company.
- general: Any other career-support message.

Rules:
- Return exactly one label.
- Prefer "general" if the message is not clearly one of the four benchmark types.
- Do not answer the user's career question.
- Only classify intent.
- Keep confidence between 0 and 1.`;
