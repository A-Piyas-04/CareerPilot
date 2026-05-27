import type { AssistantIntent } from "./detectIntent";
import type { AssistantProfile, ConversationMemoryMessage } from "./types";

type IntentPromptInput = {
  conversationMemory: ConversationMemoryMessage[];
  profile: AssistantProfile | null;
  resumeContext: string;
  userMessage: string;
};

export function buildIntentPrompt(
  intent: AssistantIntent,
  input: IntentPromptInput,
) {
  switch (intent) {
    case "readiness_check":
      return buildReadinessPrompt(input);
    case "skill_gap":
      return buildSkillGapPrompt(input);
    case "roadmap_generation":
      return buildRoadmapPrompt(input);
    case "cover_letter":
      return buildCoverLetterPrompt(input);
    case "general":
      return buildGeneralPrompt(input);
  }
}

export function buildReadinessPrompt(input: IntentPromptInput) {
  return `${contextSummary(input)}

Benchmark intent: readiness_check

Respond exactly with this markdown structure:

## Verdict
Ready / Partially ready / Not ready yet

## Why
- Specific reason grounded in the CV
- Mention matching skills and experience
- Mention limits honestly

## Strengths from your CV
- Skill or project evidence from CV
- Experience evidence from CV
- Education evidence if relevant

## Top 3 gaps
1. Gap
2. Gap
3. Gap

## Next steps
- 3 practical next actions

Rules:
- The verdict must be exactly one of: Ready, Partially ready, Not ready yet.
- Ground strengths only in the CV context.
- If the role requires things not visible in the CV, list them as gaps.
- If no job description is provided, use typical expectations and label them as "typical expectations".
- Do not overstate readiness or invent experience.`;
}

export function buildSkillGapPrompt(input: IntentPromptInput) {
  return `${contextSummary(input)}

Benchmark intent: skill_gap

Respond exactly with this markdown structure:

## Skills you already have
| Skill | Evidence from CV |
| --- | --- |

## Missing or weak skills
| Skill | Why it matters | Priority |
| --- | --- | --- |

## Priority learning order
1. Skill/topic
2. Skill/topic
3. Skill/topic

## Suggested mini-project
A small project idea that closes the most important gap.

Rules:
- Only list a skill under "already have" when the CV context explicitly supports it.
- Use "High", "Medium", or "Low" as priority.
- If the target role is unclear, ask for a target role and still give a general suggestion based on the CV.
- Clearly separate CV evidence from typical role expectations.
- Do not claim PyTorch, TensorFlow, cloud, or ML experience is present unless the CV says so.`;
}

export function buildRoadmapPrompt(input: IntentPromptInput) {
  return `${contextSummary(input)}

Benchmark intent: roadmap_generation

Respond exactly with this markdown structure:

## Roadmap: {target role}

Brief overview paragraph.

| Week | Focus | What to do | Deliverable |
| --- | --- | --- | --- |

## Recommended resources
- Resource/topic 1
- Resource/topic 2
- Resource/topic 3

## How to use this roadmap
- Short practical guidance

Rules:
- If the user specifies 3 months, create 12 weeks.
- If the user specifies 2 months, create 8 weeks.
- If the user specifies 1 month, create 4 weeks.
- If no duration is specified, default to 8 weeks.
- Start from the user's actual CV: Python, React, FastAPI, PostgreSQL, Docker, backend internship, REST API project, and BSc CS only if present in the CV context.
- Make the roadmap realistic for the current background.
- Do not say you saved the roadmap. Saving is not available until Phase 3.
- Do not invent prior achievements or experience.`;
}

export function buildCoverLetterPrompt(input: IntentPromptInput) {
  return `${contextSummary(input)}

Benchmark intent: cover_letter

Write a full professional cover letter around 250-350 words.

Include:
- Greeting
- Opening paragraph
- Body paragraph referencing real CV evidence
- Body paragraph connecting CV skills to job requirements
- Closing paragraph
- Sign-off

Rules:
- Reference only actual CV evidence, such as Python, React, FastAPI, PostgreSQL, Docker, backend intern at StartupX, REST API project, and BSc CS if present in the CV context.
- Do not claim experience with tools that are only in the job description but not in the CV.
- If PyTorch, TensorFlow, or other missing skills appear in the job description, frame them as interest, learning focus, or adjacent fit, not existing experience.
- If company name is missing, use "[Company Name]".
- If job title is missing, use "[Role Title]".
- If no job description is provided, say it is a general draft and ask the user to paste the JD for a stronger version.
- Do not invent company-specific enthusiasm beyond what the user provided.
- Keep it concise and professional.`;
}

export function buildGeneralPrompt(input: IntentPromptInput) {
  return `${contextSummary(input)}

Benchmark intent: general

Respond naturally to the user's career question.
Use the CV context where relevant, but do not force the readiness, skill gap, roadmap, or cover letter formats unless the user asks for that kind of output.
Keep the answer practical and concise.`;
}

function contextSummary({
  conversationMemory,
  profile,
  resumeContext,
  userMessage,
}: IntentPromptInput) {
  return `Current user message:
${userMessage}

Profile target role:
${profile?.target_role || "Not specified"}

Resume context length:
${resumeContext.length} characters

Recent conversation messages available:
${conversationMemory.length}`;
}
