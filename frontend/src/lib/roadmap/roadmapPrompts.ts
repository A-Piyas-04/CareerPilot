type BuildRoadmapPromptInput = {
  targetRole: string;
  durationWeeks: number;
  jobDescription?: string;
  profile?: {
    full_name?: string | null;
    target_role?: string | null;
    location?: string | null;
    bio?: string | null;
  } | null;
  resumeContext: string;
};

export const ROADMAP_SYSTEM_PROMPT = `You are CareerPilot, an AI career co-pilot that creates practical learning roadmaps.

Return valid JSON only. Do not wrap JSON in markdown fences.
Do not invent user experience, skills, companies, education, projects, or achievements.
Use the CV context as the user's starting point.
If a skill is missing from the CV, include it as a learning goal rather than claiming the user has it.`;

export function buildRoadmapPrompt({
  targetRole,
  durationWeeks,
  jobDescription,
  profile,
  resumeContext,
}: BuildRoadmapPromptInput) {
  return `Generate a week-by-week learning roadmap.

User profile:
- Name: ${profile?.full_name || "Unknown"}
- Current target role: ${profile?.target_role || "Not specified"}
- Location: ${profile?.location || "Not specified"}
- Bio: ${profile?.bio || "Not specified"}

Target role for this roadmap: ${targetRole}
Duration: ${durationWeeks} weeks

CV context:
${resumeContext}

Optional job description:
${jobDescription?.trim() || "Not provided"}

Rules:
- The response must be valid JSON only.
- The JSON must include "overview" and "items".
- "items" must contain exactly ${durationWeeks} objects.
- Each week must have one roadmap item.
- Each item must include: week_number, title, description, resources.
- Description must include a concrete deliverable.
- Resources must be an array of objects with "name" and optional "url".
- Use URLs only when you are confident they are stable official or documentation URLs.
- Start from the user's actual CV skills and experience.
- Do not claim the user already knows tools that are not in the CV context.

Expected shape:
{
  "overview": "string",
  "items": [
    {
      "week_number": 1,
      "title": "string",
      "description": "string",
      "resources": [
        { "name": "string", "url": "string" }
      ]
    }
  ]
}`;
}
