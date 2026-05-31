export const CAREERPILOT_GUARDRAIL_MESSAGE =
  "CareerPilot can help with CVs, jobs, applications, interviews, learning roadmaps, cover letters, and career productivity. Please reframe this as a career-support request.";

type GuardrailResult =
  | { allowed: true }
  | { allowed: false; message: string; reason: string };

const CAREER_PATTERNS = [
  /\b(application|apply|career|cv|cover letter|internship|interview|job|resume|roadmap|skill|task|work)\b/i,
  /\b(engineer|developer|designer|analyst|manager|scientist|role|position)\b/i,
];

const BLOCKED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern:
      /\b(build|create|deploy|write)\b.{0,32}\b(malware|ransomware|keylogger|virus|phishing kit)\b/i,
    reason: "malware_or_phishing",
  },
  {
    pattern:
      /\b(steal|exfiltrate|leak|bypass|crack|hack)\b.{0,36}\b(password|credential|account|database|bank|credit card)\b/i,
    reason: "credential_or_data_abuse",
  },
  {
    pattern: /\b(make|build|assemble)\b.{0,32}\b(bomb|explosive|weapon)\b/i,
    reason: "violent_harm",
  },
  {
    pattern: /\b(write|generate|draft)\b.{0,24}\b(hate speech|harassment|abuse)\b/i,
    reason: "abusive_content",
  },
];

const CLEAR_OFF_TOPIC_PATTERNS = [
  /\b(recipe|cook|movie plot|song lyrics|sports betting|crypto trading signal)\b/i,
  /\b(relationship advice|dating advice|astrology|horoscope)\b/i,
];

export function checkCareerPrompt(input: string): GuardrailResult {
  const normalized = input.trim();

  if (!normalized) {
    return { allowed: true };
  }

  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: false,
        message: CAREERPILOT_GUARDRAIL_MESSAGE,
        reason,
      };
    }
  }

  const isCareerRelated = CAREER_PATTERNS.some((pattern) =>
    pattern.test(normalized),
  );
  const isClearlyOffTopic = CLEAR_OFF_TOPIC_PATTERNS.some((pattern) =>
    pattern.test(normalized),
  );

  if (isClearlyOffTopic && !isCareerRelated) {
    return {
      allowed: false,
      message: CAREERPILOT_GUARDRAIL_MESSAGE,
      reason: "off_topic",
    };
  }

  return { allowed: true };
}
