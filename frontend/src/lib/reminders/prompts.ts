import type { NudgeActivitySummary } from "@/lib/reminders/types";

export const NUDGE_SYSTEM_PROMPT = `You are CareerPilot, an AI career productivity assistant.

Generate concise, practical nudges using only the provided activity summary.
Never invent applications, jobs, tasks, events, goals, roadmap items, or progress.
Return JSON only.`;

export function buildNudgePrompt(summary: NudgeActivitySummary) {
  return `Create 2-3 actionable dashboard nudges from this CareerPilot activity summary.

Rules:
- Use only the summary below.
- Keep each nudge short and specific.
- Each nudge must include: type, title, message, actionLabel, actionHref.
- Allowed type values: application, task, deadline, roadmap, general.
- Allowed actionHref values: /jobs, /tracker, /goals, /calendar, /roadmap, /dashboard.
- If there is nothing meaningful to nudge, return {"nudges":[]}.

Activity summary:
${JSON.stringify(summary, null, 2)}

Return exactly this JSON shape:
{
  "nudges": [
    {
      "type": "task",
      "title": "Clear overdue tasks",
      "message": "You have 4 overdue tasks. Start by completing or rescheduling one today.",
      "actionLabel": "Open Tasks",
      "actionHref": "/goals"
    }
  ]
}`;
}
