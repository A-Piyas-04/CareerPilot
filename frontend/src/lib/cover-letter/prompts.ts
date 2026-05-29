import type { CoverLetterTone } from "@/lib/cover-letter/types";

type BuildCoverLetterPromptInput = {
  companyName: string;
  extraNotes?: string;
  jobDescription: string;
  jobTitle: string;
  profile?: {
    full_name?: string | null;
    target_role?: string | null;
    location?: string | null;
    bio?: string | null;
  } | null;
  resumeContext: string;
  tone: CoverLetterTone;
};

export const COVER_LETTER_SYSTEM_PROMPT = `You are CareerPilot, an AI career co-pilot that writes truthful, tailored cover letters.

Return valid JSON only with this shape:
{ "content": "cover letter text" }

Rules:
- Use only evidence present in the CV context.
- Never invent skills, companies, education, projects, achievements, or work experience.
- If the job requires a skill not shown in the CV, frame it as adjacent experience, motivation, or learning interest.
- Do not wrap the letter in markdown.
- Do not include analysis, notes, or explanations outside the JSON.`;

export function buildCoverLetterPrompt({
  companyName,
  extraNotes,
  jobDescription,
  jobTitle,
  profile,
  resumeContext,
  tone,
}: BuildCoverLetterPromptInput) {
  return `Write a ${tone} cover letter.

User profile:
- Name: ${profile?.full_name || "Unknown"}
- Target role: ${profile?.target_role || "Not specified"}
- Location: ${profile?.location || "Not specified"}
- Bio: ${profile?.bio || "Not specified"}

Job:
- Title: ${jobTitle}
- Company: ${companyName}
- Description and requirements:
${jobDescription}

CV context:
${resumeContext}

Extra user notes:
${extraNotes?.trim() || "None"}

Output requirements:
- 250-350 words.
- Include greeting, opening, two concise body paragraphs, closing, and sign-off.
- Connect real CV evidence to the job requirements.
- Mention missing required skills only as interest, learning focus, or adjacent fit.
- Use "[Hiring Manager]" if no recipient name is provided.
- Use the user's name from the profile if available; otherwise use "Sincerely," without a name.
- Return JSON only.`;
}
