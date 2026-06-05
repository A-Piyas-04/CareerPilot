import type { AssistantProfile, ConversationMemoryMessage } from "@/lib/assistant/types";
import type {
  InterviewAction,
  InterviewSettings,
  InterviewType,
} from "@/lib/types/assistant";

import type { CodingProblem } from "./problemBank";

type BuildInterviewPromptInput = {
  action: InterviewAction;
  jobContext?: {
    text?: string | null;
    title?: string | null;
    company?: string | null;
  } | null;
  memory: ConversationMemoryMessage[];
  problem?: CodingProblem | null;
  profile: AssistantProfile | null;
  resumeContext: string;
  settings: InterviewSettings;
  userMessage: string;
};

export function buildInterviewSystemPrompt({
  action,
  jobContext,
  memory,
  problem,
  profile,
  resumeContext,
  settings,
  userMessage,
}: BuildInterviewPromptInput) {
  const type = settings.interviewType;
  const targetRole =
    settings.targetRole?.trim() ||
    profile?.target_role?.trim() ||
    jobContext?.title?.trim() ||
    "the target role";
  const focusAreas =
    settings.focusAreas.length > 0
      ? settings.focusAreas.join(", ")
      : "behavioral clarity, technical fundamentals, and practical communication";
  const jobBlock = jobContext?.text
    ? `\nSelected Job/Application Context:\n${jobContext.text}`
    : "";
  const problemBlock = problem ? `\n${formatProblem(problem)}` : "";
  const nextQuestionInstruction = buildNextQuestionInstruction({
    action,
    problem,
    targetRole,
    type,
  });
  const recentTurnCount = memory.length;

  return `You are CareerPilot Interview Prep, a structured mock interview coach.

User Profile:
Name: ${profile?.full_name || "Unknown"}
Target Role: ${targetRole}
Location: ${profile?.location || "Not specified"}

Interview Setup:
Type: ${type}
Difficulty: ${settings.difficulty}
Focus Areas: ${focusAreas}
Conversation Turns Loaded: ${recentTurnCount}

CV Context:
${resumeContext || "No CV context was available."}${jobBlock}${problemBlock}

Current User Message:
${userMessage}

Rules:
- Run the interview one question or problem at a time.
- Ground behavioral feedback in the CV context and selected job context only.
- Never invent experience, employers, education, projects, skills, or achievements.
- If evidence is missing, say what evidence is missing and how the user can phrase a truthful answer.
- For behavioral answers, coach STAR structure: Situation, Task, Action, Result.
- For technical answers, check conceptual accuracy and communication.
- For coding answers, evaluate algorithm idea, correctness, complexity, edge cases, and readability. Do not claim code was executed.
- If handwritten or OCR-transcribed code is uncertain, distinguish transcription uncertainty from real code issues.
- Keep responses concise but complete.

Required feedback format when evaluating an answer:
## Score Summary
- Score: X/10
- Interview signal: Strong / Mixed / Needs work

## What Went Well
- ...

## What Was Missing
- ...

## Improved Answer or Approach
- For behavioral answers, provide a STAR rewrite.
- For coding/technical answers, provide a clearer approach and corrected pseudocode only when useful.

## CV Evidence To Mention
- Cite only evidence present in the CV context.
- If no evidence exists, say what is missing.

## Next Prompt
- Ask exactly one follow-up question or one next problem.

${nextQuestionInstruction}`;
}

function buildNextQuestionInstruction({
  action,
  problem,
  targetRole,
  type,
}: {
  action: InterviewAction;
  problem?: CodingProblem | null;
  targetRole: string;
  type: InterviewType;
}) {
  if (action === "start" || action === "next_question") {
    if ((type === "coding" || type === "mixed") && problem) {
      return `For this turn, present the coding problem below as the next prompt. Do not include the expected approach or solution. Ask the user to explain their approach and provide code if possible.`;
    }

    if (type === "behavioral") {
      return `For this turn, ask one behavioral interview question for ${targetRole}. Make it answerable with the user's CV evidence and ask for a STAR-format answer.`;
    }

    if (type === "technical") {
      return `For this turn, ask one technical concept question for ${targetRole}. Keep it appropriate for the configured difficulty.`;
    }

    return `For this turn, choose one behavioral or technical prompt for ${targetRole}. If choosing coding, use the provided internal problem and do not reveal the solution.`;
  }

  if (action === "evaluate") {
    return "For this turn, evaluate the submitted answer directly. Do not ask a new question until after feedback is complete.";
  }

  return "For this turn, evaluate the user's answer first, then ask one concise follow-up or next prompt.";
}

function formatProblem(problem: CodingProblem) {
  const examples = problem.examples
    .map(
      (example, index) =>
        `Example ${index + 1}: Input: ${example.input}; Output: ${example.output}${
          example.explanation ? `; Note: ${example.explanation}` : ""
        }`,
    )
    .join("\n");

  return `Internal Coding Problem:
ID: ${problem.id}
Title: ${problem.title}
Difficulty: ${problem.difficulty}
Topics: ${problem.tags.join(", ")}
Prompt: ${problem.prompt}
Examples:
${examples}
Constraints:
${problem.constraints.map((constraint) => `- ${constraint}`).join("\n")}
Expected Approach for evaluation only:
${problem.expectedApproach}
Edge Cases for evaluation only:
${problem.edgeCases.map((edgeCase) => `- ${edgeCase}`).join("\n")}`;
}
