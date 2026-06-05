import type {
  InterviewDifficulty,
  InterviewType,
} from "@/lib/types/assistant";

export type InterviewQuestionType = "behavioral" | "technical" | "coding";

export type InterviewPrepSetup = {
  difficulty: InterviewDifficulty;
  focusAreas: string[];
  questionCount: number;
  roleId: string;
  targetRole: string;
  type: InterviewType;
};

export type InterviewPrepQuestion = {
  codingProblemId?: string | null;
  difficulty: InterviewDifficulty;
  id: string;
  prompt: string;
  roleLabel: string;
  timeLimitSeconds: number;
  title: string;
  type: InterviewQuestionType;
};

export type InterviewPrepEvaluation = {
  answerAssessment: string;
  cvEvidence: string[];
  expectedAnswer: string;
  feedback: string;
  idealAnswer: string;
  missing: string[];
  score: number;
  strengths: string[];
};

export type InterviewPrepAttempt = {
  answer: string;
  elapsedSeconds: number;
  evaluation: InterviewPrepEvaluation;
  id?: string;
  question: InterviewPrepQuestion;
  questionIndex?: number;
  secondsLeft?: number | null;
  skipped: boolean;
  status?: "answering" | "completed" | "skipped";
};

export type InterviewPrepSession = {
  attempts: InterviewPrepAttempt[];
  averageScore: number;
  completedAt: string | null;
  createdAt: string;
  currentIndex: number;
  id: string;
  questionCount: number;
  secondsLeft: number | null;
  setup: InterviewPrepSetup;
  status: "in_progress" | "completed" | "abandoned";
  updatedAt: string;
};
