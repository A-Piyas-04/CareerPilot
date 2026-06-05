import { getResumeContext } from "@/lib/assistant/getResumeContext";
import type { AssistantProfile } from "@/lib/assistant/types";
import { createGeminiMultimodalText, createGeminiText, GEMINI_MODEL } from "@/lib/gemini";
import { findCodingProblem, selectCodingProblem } from "@/lib/assistant/interview/problemBank";
import { createClient } from "@/lib/supabase/server";
import type { InterviewDifficulty, InterviewType } from "@/lib/types/assistant";

import { findInterviewRole } from "./roles";
import type {
  InterviewPrepEvaluation,
  InterviewPrepQuestion,
  InterviewPrepSession,
  InterviewPrepSetup,
  InterviewQuestionType,
} from "./types";

export class InterviewPrepHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "InterviewPrepHttpError";
    this.status = status;
  }
}

export async function getInterviewPrepAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new InterviewPrepHttpError("User not authenticated.", 401);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new InterviewPrepHttpError("User not authenticated.", 401);
  }

  return { accessToken: session.access_token, supabase, user };
}

export async function loadInterviewPrepContext({
  accessToken,
  query,
  userId,
}: {
  accessToken: string;
  query: string;
  userId: string;
}) {
  const supabase = await createClient();
  const [{ data: profile }, resumeContext] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, target_role, location, bio")
      .eq("id", userId)
      .maybeSingle(),
    getResumeContext({
      accessToken,
      intent: "general",
      query,
      userId,
    }),
  ]);

  return {
    profile: profile as AssistantProfile | null,
    resumeContext,
  };
}

export function normalizeSetup(value: unknown): InterviewPrepSetup {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const roleId = typeof raw.roleId === "string" ? raw.roleId : "";
  const role = findInterviewRole(roleId);
  const questionCount = Number(raw.questionCount);

  return {
    difficulty: isDifficulty(raw.difficulty) ? raw.difficulty : "medium",
    focusAreas: Array.isArray(raw.focusAreas)
      ? raw.focusAreas
          .filter((area): area is string => typeof area === "string")
          .map((area) => area.trim())
          .filter(Boolean)
      : [],
    questionCount:
      Number.isFinite(questionCount) && questionCount >= 5 && questionCount <= 10
        ? Math.round(questionCount)
        : 5,
    roleId: role.id,
    targetRole:
      typeof raw.targetRole === "string" && raw.targetRole.trim()
        ? raw.targetRole.trim()
        : role.label,
    type: isInterviewType(raw.type) ? raw.type : "mixed",
  };
}

export function normalizeSession(row: Record<string, unknown>, attempts: InterviewPrepAttemptRow[] = []): InterviewPrepSession {
  const setup = normalizeSetup(row.setup);

  return {
    attempts: attempts.map(normalizeAttempt),
    averageScore: Number(row.average_score ?? 0),
    completedAt: typeof row.completed_at === "string" ? row.completed_at : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    currentIndex: Number(row.current_index ?? 0),
    id: String(row.id),
    questionCount: Number(row.question_count ?? setup.questionCount),
    secondsLeft:
      typeof row.seconds_left === "number" ? row.seconds_left : null,
    setup,
    status:
      row.status === "completed" || row.status === "abandoned"
        ? row.status
        : "in_progress",
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : "",
  };
}

type InterviewPrepAttemptRow = Record<string, unknown>;

export function normalizeAttempt(row: InterviewPrepAttemptRow) {
  const rawEvaluation =
    row.evaluation && typeof row.evaluation === "object"
      ? row.evaluation as Record<string, unknown>
      : {};
  const rawQuestion =
    row.question && typeof row.question === "object"
      ? row.question as InterviewPrepQuestion
      : {
          difficulty: "medium",
          id: String(row.id),
          prompt: "",
          roleLabel: "",
          timeLimitSeconds: 0,
          title: "Question",
          type: "technical",
        } satisfies InterviewPrepQuestion;

  const status: "answering" | "completed" | "skipped" =
    row.status === "completed" || row.status === "skipped"
      ? row.status
      : "answering";

  return {
    answer: typeof row.answer === "string" ? row.answer : "",
    elapsedSeconds: Number(row.elapsed_seconds ?? 0),
    evaluation: normalizeEvaluation(rawEvaluation),
    id: String(row.id),
    question: rawQuestion,
    questionIndex: Number(row.question_index ?? 0),
    secondsLeft:
      typeof row.seconds_left === "number" ? row.seconds_left : null,
    skipped: row.skipped === true,
    status,
  };
}

export async function loadOwnedInterviewSession({
  sessionId,
  supabase,
  userId,
}: {
  sessionId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
}) {
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new InterviewPrepHttpError("Interview session not found.", 404);
  }

  return data as Record<string, unknown>;
}

export function resolveQuestionType({
  index,
  type,
}: {
  index: number;
  type: InterviewType;
}): InterviewQuestionType {
  if (type !== "mixed") {
    return type;
  }

  const cycle: InterviewQuestionType[] = ["behavioral", "technical", "coding"];
  return cycle[index % cycle.length];
}

export function questionTimeLimitSeconds({
  difficulty,
  type,
}: {
  difficulty: InterviewDifficulty;
  type: InterviewQuestionType;
}) {
  const byDifficulty = {
    easy: { behavioral: 120, coding: 600, technical: 180 },
    medium: { behavioral: 180, coding: 900, technical: 240 },
    hard: { behavioral: 240, coding: 1200, technical: 360 },
  } satisfies Record<InterviewDifficulty, Record<InterviewQuestionType, number>>;

  return byDifficulty[difficulty][type];
}

export async function generateInterviewQuestion({
  accessToken,
  answeredQuestionIds,
  questionIndex,
  setup,
  userId,
}: {
  accessToken: string;
  answeredQuestionIds: string[];
  questionIndex: number;
  setup: InterviewPrepSetup;
  userId: string;
}): Promise<InterviewPrepQuestion> {
  const role = findInterviewRole(setup.roleId);
  const questionType = resolveQuestionType({ index: questionIndex, type: setup.type });
  const { profile, resumeContext } = await loadInterviewPrepContext({
    accessToken,
    query: `${setup.targetRole}\n${role.promptFocus}\n${setup.focusAreas.join(", ")}`,
    userId,
  });

  if (questionType === "coding") {
    const problem = selectCodingProblem({
      conversationId: `${setup.roleId}-${questionIndex}`,
      difficulty: setup.difficulty,
      focusAreas: setup.focusAreas,
      messageCount: questionIndex,
    });

    return {
      codingProblemId: problem.id,
      difficulty: setup.difficulty,
      id: `coding-${problem.id}-${questionIndex}`,
      prompt: formatCodingPrompt(problem),
      roleLabel: role.label,
      timeLimitSeconds: questionTimeLimitSeconds({
        difficulty: setup.difficulty,
        type: "coding",
      }),
      title: problem.title,
      type: "coding",
    };
  }

  const raw = await createGeminiText({
    maxOutputTokens: 700,
    model: GEMINI_MODEL,
    prompt: buildQuestionPrompt({
      answeredQuestionIds,
      profile,
      questionIndex,
      questionType,
      resumeContext: resumeContext.text,
      role,
      setup,
    }),
    systemPrompt: QUESTION_SYSTEM_PROMPT,
    temperature: 0.35,
  });
  const parsed = parseJsonObject(raw);
  const title = stringOr(parsed.title, `${capitalize(questionType)} question`);
  const prompt = stringOr(
    parsed.prompt,
    fallbackQuestion(questionType, setup.targetRole),
  );

  return {
    difficulty: setup.difficulty,
    id: stringOr(
      parsed.id,
      `${questionType}-${setup.roleId}-${questionIndex}-${hashString(prompt)}`,
    ),
    prompt,
    roleLabel: role.label,
    timeLimitSeconds: questionTimeLimitSeconds({
      difficulty: setup.difficulty,
      type: questionType,
    }),
    title,
    type: questionType,
  };
}

export async function evaluateInterviewAnswer({
  accessToken,
  answer,
  elapsedSeconds,
  question,
  setup,
  skipped,
  userId,
}: {
  accessToken: string;
  answer: string;
  elapsedSeconds: number;
  question: InterviewPrepQuestion;
  setup: InterviewPrepSetup;
  skipped: boolean;
  userId: string;
}): Promise<InterviewPrepEvaluation> {
  if (skipped) {
    return {
      answerAssessment: "No answer was submitted because the question was skipped.",
      cvEvidence: [],
      expectedAnswer: expectedAnswerForQuestion(question, setup),
      feedback: "Skipped question. This question receives 0 points.",
      idealAnswer: "Try this question again in a future session.",
      missing: ["No answer submitted."],
      score: 0,
      strengths: [],
    };
  }

  const lowEffortReason = lowEffortAnswerReason(answer, question.type);
  if (lowEffortReason) {
    return {
      answerAssessment: `The submitted answer was: "${truncateText(answer, 240)}". ${lowEffortReason}`,
      cvEvidence: [],
      expectedAnswer: expectedAnswerForQuestion(question, setup),
      feedback:
        "This answer does not meaningfully address the interview question, so it earns 0 points. A valid answer should explain the relevant concept, approach, tradeoffs, and evidence from your experience when applicable.",
      idealAnswer: expectedAnswerForQuestion(question, setup),
      missing: [
        "Relevant explanation",
        "Specific reasoning tied to the question",
        "Concrete example, algorithm, or CV evidence",
      ],
      score: 0,
      strengths: [],
    };
  }

  const role = findInterviewRole(setup.roleId);
  const { profile, resumeContext } = await loadInterviewPrepContext({
    accessToken,
    query: `${question.prompt}\n${answer}`,
    userId,
  });
  const raw = await createGeminiText({
    maxOutputTokens: 1400,
    model: GEMINI_MODEL,
    prompt: buildEvaluationPrompt({
      answer,
      elapsedSeconds,
      profile,
      question,
      resumeContext: resumeContext.text,
      role,
      setup,
    }),
    systemPrompt: EVALUATION_SYSTEM_PROMPT,
    temperature: 0.25,
  });

  return normalizeEvaluation(parseJsonObject(raw));
}

export async function evaluateInterviewUpload({
  accessToken,
  file,
  question,
  setup,
  userId,
}: {
  accessToken: string;
  file: File;
  question: InterviewPrepQuestion;
  setup: InterviewPrepSetup;
  userId: string;
}) {
  const problem = findCodingProblem(question.codingProblemId);
  if (!problem) {
    throw new InterviewPrepHttpError("This question does not have an active coding problem.", 400);
  }

  const { resumeContext } = await loadInterviewPrepContext({
    accessToken,
    query: `${question.prompt}\n${setup.targetRole}`,
    userId,
  });
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await createGeminiMultimodalText({
    fileBase64: buffer.toString("base64"),
    maxOutputTokens: 1700,
    mimeType: file.type,
    prompt: `${EVALUATION_SYSTEM_PROMPT}

Question:
${question.prompt}

Expected approach:
${problem.expectedApproach}

Edge cases:
${problem.edgeCases.join(", ")}

CV Context:
${resumeContext.text}

The uploaded file contains a handwritten or scanned coding answer. Transcribe it, then evaluate it. Return JSON only with:
{
  "transcription": "code or explanation extracted from the file",
  "transcriptionConfidence": "high" | "medium" | "low",
  "score": 0-10,
  "expectedAnswer": "what a strong solution should cover",
  "answerAssessment": "what the uploaded answer actually appears to do",
  "feedback": "short practical feedback",
  "strengths": ["..."],
  "missing": ["..."],
  "idealAnswer": "improved approach or pseudocode",
  "cvEvidence": ["..."]
}`,
    temperature: 0.2,
  });
  const parsed = parseJsonObject(result.text);

  return {
    evaluation: normalizeEvaluation(parsed),
    transcription: stringOr(parsed.transcription, ""),
    transcriptionConfidence:
      parsed.transcriptionConfidence === "high" ||
      parsed.transcriptionConfidence === "medium" ||
      parsed.transcriptionConfidence === "low"
        ? parsed.transcriptionConfidence
        : "medium",
  };
}

const QUESTION_SYSTEM_PROMPT = `You are CareerPilot Interview Prep. Generate one interview question only. Return valid JSON only.`;

const EVALUATION_SYSTEM_PROMPT = `You are CareerPilot Interview Prep. Evaluate one interview answer. Return valid JSON only. Score honestly from 0 to 10. Do not invent CV evidence. Do not claim code was executed.`;

function buildQuestionPrompt({
  answeredQuestionIds,
  profile,
  questionIndex,
  questionType,
  resumeContext,
  role,
  setup,
}: {
  answeredQuestionIds: string[];
  profile: AssistantProfile | null;
  questionIndex: number;
  questionType: InterviewQuestionType;
  resumeContext: string;
  role: ReturnType<typeof findInterviewRole>;
  setup: InterviewPrepSetup;
}) {
  return `Generate question ${questionIndex + 1} of ${setup.questionCount}.

Selected role family: ${role.label}
Role aliases: ${role.aliases.join(", ")}
Specific target role: ${setup.targetRole}
Difficulty: ${setup.difficulty}
Question type: ${questionType}
Role-specific focus: ${role.promptFocus}
Technical areas: ${role.technicalAreas.join(", ")}
User focus areas: ${setup.focusAreas.join(", ") || "none"}
Already used question IDs: ${answeredQuestionIds.join(", ") || "none"}

Profile:
Name: ${profile?.full_name ?? "Unknown"}
Target role in profile: ${profile?.target_role ?? "Not specified"}

CV context:
${resumeContext}

Rules:
- Return one question only.
- Do not include the answer.
- For behavioral questions, make it STAR-answerable and grounded in realistic CV evidence.
- For technical questions, test concepts relevant to the selected role.
- Avoid repeating previous question IDs.
- Return JSON only:
{
  "id": "short-stable-id",
  "title": "short title",
  "prompt": "question text"
}`;
}

function buildEvaluationPrompt({
  answer,
  elapsedSeconds,
  profile,
  question,
  resumeContext,
  role,
  setup,
}: {
  answer: string;
  elapsedSeconds: number;
  profile: AssistantProfile | null;
  question: InterviewPrepQuestion;
  resumeContext: string;
  role: ReturnType<typeof findInterviewRole>;
  setup: InterviewPrepSetup;
}) {
  return `Evaluate this interview answer.

Selected role family: ${role.label}
Specific target role: ${setup.targetRole}
Difficulty: ${setup.difficulty}
Question type: ${question.type}
Question: ${question.prompt}
Time limit seconds: ${question.timeLimitSeconds}
Elapsed seconds: ${elapsedSeconds}
Role-specific focus: ${role.promptFocus}

Profile:
Name: ${profile?.full_name ?? "Unknown"}

CV context:
${resumeContext}

User answer:
${answer}

Rules:
- Ground CV evidence only in the CV context.
- For behavioral answers, assess STAR structure.
- For coding answers, assess approach, correctness, complexity, edge cases, and readability without executing code.
- Be strict. Generic filler, repetition, "blah blah", jokes, unrelated text, or answers that do not address the question must receive 0 or 1.
- Weak but relevant answers should usually score 2-4, partial answers 5-6, good answers 7-8, excellent complete answers 9-10.
- Explain exactly what was expected and exactly what the user answered.
- Return JSON only:
{
  "score": 0-10,
  "expectedAnswer": "what a strong answer should cover",
  "answerAssessment": "what the submitted answer actually said and why it did or did not answer the question",
  "feedback": "concise feedback",
  "strengths": ["..."],
  "missing": ["..."],
  "idealAnswer": "improved answer or approach",
  "cvEvidence": ["..."]
}`;
}

function formatCodingPrompt(problem: NonNullable<ReturnType<typeof findCodingProblem>>) {
  const examples = problem.examples
    .map((example, index) => {
      const explanation = example.explanation ? `\nExplanation: ${example.explanation}` : "";
      return `Example ${index + 1}\nInput: ${example.input}\nOutput: ${example.output}${explanation}`;
    })
    .join("\n\n");

  return `${problem.prompt}

${examples}

Constraints:
${problem.constraints.map((constraint) => `- ${constraint}`).join("\n")}

Write your approach and code. You can also upload a handwritten solution.`;
}

function normalizeEvaluation(value: Record<string, unknown>): InterviewPrepEvaluation {
  return {
    answerAssessment: stringOr(
      value.answerAssessment,
      "The submitted answer could not be assessed in detail.",
    ),
    cvEvidence: stringArray(value.cvEvidence),
    expectedAnswer: stringOr(
      value.expectedAnswer,
      "A strong answer should directly address the question with relevant concepts, tradeoffs, examples, and evidence.",
    ),
    feedback: stringOr(value.feedback, "No detailed feedback was generated."),
    idealAnswer: stringOr(value.idealAnswer, "No model answer was generated."),
    missing: stringArray(value.missing),
    score: clampScore(value.score),
    strengths: stringArray(value.strengths),
  };
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const cleaned = stripCodeFence(raw);

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const extracted = extractFirstJsonObject(cleaned);
    if (extracted) {
      try {
        return JSON.parse(extracted) as Record<string, unknown>;
      } catch {
        // Fall through to raw-text fallback below.
      }
    }

    return {
      answerAssessment: "The AI response was not valid JSON, so the submitted answer could not be assessed in structured fields.",
      feedback: cleaned || "The AI response could not be parsed clearly.",
      expectedAnswer:
        "A strong answer should directly address the question with relevant concepts, tradeoffs, examples, and evidence.",
      idealAnswer:
        "Use the feedback above as guidance, then retry this style of question in a future session.",
      missing: ["The AI response was not valid JSON, so detailed fields were limited."],
      score: inferScoreFromText(cleaned),
      strengths: [],
      cvEvidence: [],
    };
  }
}

function stripCodeFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractFirstJsonObject(value: string) {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");

  if (start < 0 || end <= start) {
    return null;
  }

  return value.slice(start, end + 1);
}

function inferScoreFromText(value: string) {
  const match = value.match(/["']?(?:score|rating)["']?\s*:?\s*(\d{1,2})(?:\s*\/\s*10)?/i);
  if (!match) {
    return 2;
  }

  return clampScore(Number(match[1]));
}

function lowEffortAnswerReason(answer: string, type: InterviewQuestionType) {
  const normalized = answer.toLowerCase().trim();
  const words = normalized.match(/[a-z0-9_+#-]+/g) ?? [];
  const uniqueWords = new Set(words);
  const repeatedFiller = /\b(blah|asdf|qwerty|test|dummy|random|idk|i don't know|dont know|no idea)\b/i.test(
    normalized,
  );
  const tooShort = words.length < (type === "coding" ? 8 : 12);
  const mostlyRepeated = words.length >= 4 && uniqueWords.size <= Math.max(2, words.length / 4);
  const noSignal =
    !/[{}();=<>]|\b(function|def|class|return|because|therefore|first|then|complexity|star|situation|task|action|result|api|database|model|algorithm|data|time|space)\b/i.test(
      answer,
    );

  if (repeatedFiller) {
    return "It appears to be filler or placeholder text rather than an interview answer.";
  }

  if (tooShort && noSignal) {
    return "It is too short and does not include enough relevant substance to evaluate.";
  }

  if (mostlyRepeated && noSignal) {
    return "It is mostly repeated text and does not provide a meaningful answer.";
  }

  return null;
}

function expectedAnswerForQuestion(
  question: InterviewPrepQuestion,
  setup: InterviewPrepSetup,
) {
  if (question.type === "coding") {
    const problem = findCodingProblem(question.codingProblemId);
    return problem
      ? `A strong answer should describe ${problem.expectedApproach}, include correct code or pseudocode, analyze time and space complexity, and mention edge cases such as ${problem.edgeCases.join(", ")}.`
      : "A strong coding answer should explain the algorithm, provide correct code or pseudocode, cover complexity, and discuss edge cases.";
  }

  if (question.type === "behavioral") {
    return `A strong answer should use STAR: Situation, Task, Action, and Result. It should be specific, truthful, and tied to real CV evidence for ${setup.targetRole}.`;
  }

  return `A strong answer should explain the core concept clearly, connect it to ${setup.targetRole}, mention tradeoffs or examples, and avoid vague filler.`;
}

function truncateText(value: string, maxLength: number) {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3)}...`
    : normalized;
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
}

function clampScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(10, Math.round(score)));
}

function fallbackQuestion(type: InterviewQuestionType, targetRole: string) {
  if (type === "behavioral") {
    return `Tell me about a project or experience that proves you are ready for ${targetRole}. Use the STAR format.`;
  }
  return `Explain one core technical concept that is important for ${targetRole}, and describe how you have used or would use it.`;
}

function capitalize(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}

function isDifficulty(value: unknown): value is InterviewDifficulty {
  return value === "easy" || value === "medium" || value === "hard";
}

function isInterviewType(value: unknown): value is InterviewType {
  return (
    value === "behavioral" ||
    value === "technical" ||
    value === "coding" ||
    value === "mixed"
  );
}

export function jsonError(message: string, status: number) {
  return Response.json({ detail: message }, { status });
}
