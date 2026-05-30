import { Badge, type BadgeTone } from "@/components/ui";
import type { AssistantIntent } from "@/lib/assistant/detectIntent";

const INTENT_CONFIG: Record<
  AssistantIntent,
  { label: string; tone: BadgeTone }
> = {
  readiness_check: {
    label: "Readiness Check",
    tone: "emerald",
  },
  skill_gap: {
    label: "Skill Gap",
    tone: "amber",
  },
  roadmap_generation: {
    label: "Roadmap",
    tone: "violet",
  },
  cover_letter: {
    label: "Cover Letter",
    tone: "sky",
  },
  general: {
    label: "General Guidance",
    tone: "neutral",
  },
};

export function getIntentFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): AssistantIntent | null {
  const intent = metadata?.intent;
  if (typeof intent !== "string") return null;
  if (intent in INTENT_CONFIG) {
    return intent as AssistantIntent;
  }
  return null;
}

type IntentBadgeProps = {
  intent: AssistantIntent | null | undefined;
  className?: string;
};

export function IntentBadge({ intent, className = "" }: IntentBadgeProps) {
  if (!intent || !(intent in INTENT_CONFIG)) {
    return null;
  }

  const config = INTENT_CONFIG[intent];

  return (
    <Badge tone={config.tone} className={`text-[11px] ${className}`.trim()}>
      {config.label}
    </Badge>
  );
}
