"use client";

import {
  Brain,
  CheckCircle2,
  Clock,
  FileUp,
  Play,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui";
import { PageHeader, PageShell } from "@/components/layout";
import {
  INTERVIEW_DIFFICULTIES,
  INTERVIEW_PREP_ROLES,
  INTERVIEW_TYPES,
} from "@/lib/interview-prep/roles";
import type {
  InterviewPrepAttempt,
  InterviewPrepEvaluation,
  InterviewPrepQuestion,
  InterviewPrepSession,
  InterviewPrepSetup,
} from "@/lib/interview-prep/types";
import type {
  InterviewDifficulty,
  InterviewType,
} from "@/lib/types/assistant";
import {
  btnPrimarySky,
  inputFieldSky,
  surfaceCardElevated,
} from "@/lib/ui-theme";

type Stage = "setup" | "loading_question" | "answering" | "evaluating" | "complete";

export function InterviewPrepPageClient() {
  const [setup, setSetup] = useState<InterviewPrepSetup>({
    difficulty: "medium",
    focusAreas: ["behavioral", "data structures", "algorithms"],
    questionCount: 5,
    roleId: INTERVIEW_PREP_ROLES[0].id,
    targetRole: INTERVIEW_PREP_ROLES[0].label,
    type: "mixed",
  });
  const [stage, setStage] = useState<Stage>("setup");
  const [question, setQuestion] = useState<InterviewPrepQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState<InterviewPrepAttempt[]>([]);
  const [history, setHistory] = useState<InterviewPrepSession[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<InterviewPrepSession | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const currentIndex = attempts.length;
  const progressPct = Math.round((attempts.length / setup.questionCount) * 100);
  const totalScore = attempts.reduce(
    (sum, attempt) => sum + attempt.evaluation.score,
    0,
  );
  const averageScore = attempts.length
    ? Math.round(totalScore / attempts.length)
    : 0;

  useEffect(() => {
    void loadSessions();
    // Load persisted interview state once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stage !== "answering" || secondsLeft <= 0 || !question) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSecondsLeft((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [question, secondsLeft, stage]);

  useEffect(() => {
    if (!sessionId || stage !== "answering" || !question) {
      return;
    }

    const save = () => {
      void saveSessionProgress({
        currentIndex,
        secondsLeft,
        sessionId,
      });
    };
    const interval = window.setInterval(save, 5000);

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        save();
      }
    }

    window.addEventListener("beforeunload", save);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("beforeunload", save);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentIndex, question, secondsLeft, sessionId, stage]);

  useEffect(() => {
    if (stage === "answering" && secondsLeft === 0 && question) {
      void submitAnswer({ skipped: true });
    }
    // submitAnswer intentionally closes over the current question/answer state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, secondsLeft, stage]);

  async function loadSessions() {
    try {
      const response = await fetch("/api/interview-prep/sessions");
      if (!response.ok) {
        throw new Error(await readApiError(response));
      }
      const data = (await response.json()) as {
        activeSession: InterviewPrepSession | null;
        sessions: InterviewPrepSession[];
      };
      setHistory(data.sessions.filter((session) => session.status === "completed"));

      if (data.activeSession && stage === "setup") {
        await restoreSession(data.activeSession.id);
      }
    } catch (err) {
      setError(errorMessage(err, "Could not load interview history."));
    }
  }

  async function restoreSession(id: string) {
    const response = await fetch(`/api/interview-prep/sessions/${id}`);
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }
    const data = (await response.json()) as { session: InterviewPrepSession };
    const session = data.session;
    const completedAttempts = session.attempts.filter(
      (attempt) => attempt.status === "completed" || attempt.status === "skipped",
    );
    const answeringAttempt = session.attempts.find(
      (attempt) => attempt.status === "answering",
    );

    setSessionId(session.id);
    setSetup(session.setup);
    setAttempts(completedAttempts);
    setSelectedHistory(null);

    if (session.status === "completed") {
      setAttempts(session.attempts);
      setStage("complete");
      return;
    }

    if (answeringAttempt) {
      setQuestion(answeringAttempt.question);
      setAnswer(answeringAttempt.answer ?? "");
      setSecondsLeft(
        answeringAttempt.secondsLeft ??
          session.secondsLeft ??
          answeringAttempt.question.timeLimitSeconds,
      );
      setStartedAt(Date.now());
      setStage("answering");
      return;
    }

    await loadQuestion(completedAttempts.length, completedAttempts, session.id);
  }

  async function startInterview() {
    setAttempts([]);
    setSelectedHistory(null);
    setQuestion(null);
    setAnswer("");
    const data = await requestJson<{ session: InterviewPrepSession }>(
      "/api/interview-prep/sessions",
      { setup },
    );
    setSessionId(data.session.id);
    await loadQuestion(0, [], data.session.id);
  }

  async function loadQuestion(
    index: number,
    previousAttempts: InterviewPrepAttempt[],
    targetSessionId = sessionId,
  ) {
    setError(null);
    setStage("loading_question");
    try {
      const response = await requestJson<{ question: InterviewPrepQuestion }>(
        "/api/interview-prep/question",
        {
          answeredQuestionIds: previousAttempts.map((attempt) => attempt.question.id),
          questionIndex: index,
          sessionId: targetSessionId,
          setup,
        },
      );
      setQuestion(response.question);
      setAnswer("");
      setSecondsLeft(response.question.timeLimitSeconds);
      setStartedAt(Date.now());
      setStage("answering");
    } catch (err) {
      setError(errorMessage(err, "Could not load interview question."));
      setStage(index === 0 ? "setup" : "answering");
    }
  }

  async function submitAnswer({ skipped = false }: { skipped?: boolean } = {}) {
    if (!question || stage !== "answering") {
      return;
    }

    if (!skipped && !answer.trim()) {
      setError("Write an answer or skip the question.");
      return;
    }

    setError(null);
    setStage("evaluating");
    const elapsedSeconds = startedAt
      ? Math.max(0, Math.round((Date.now() - startedAt) / 1000))
      : question.timeLimitSeconds - secondsLeft;

    try {
      const response = await requestJson<{ evaluation: InterviewPrepEvaluation }>(
        "/api/interview-prep/evaluate",
        {
          answer,
          elapsedSeconds,
          question,
          questionIndex: currentIndex,
          sessionId,
          setup,
          skipped,
        },
      );
      const nextAttempts = [
        ...attempts,
        {
          answer: skipped ? "" : answer,
          elapsedSeconds,
          evaluation: response.evaluation,
          question,
          skipped,
          status: skipped ? ("skipped" as const) : ("completed" as const),
        },
      ];
      setAttempts(nextAttempts);
      if (nextAttempts.length >= setup.questionCount) {
        setStage("complete");
      } else {
        await loadQuestion(nextAttempts.length, nextAttempts, sessionId);
      }
    } catch (err) {
      setError(errorMessage(err, "Could not evaluate your answer."));
      setStage("answering");
    }
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !question) return;

    setError(null);
    setUploading(true);
    const elapsedSeconds = startedAt
      ? Math.max(0, Math.round((Date.now() - startedAt) / 1000))
      : question.timeLimitSeconds - secondsLeft;

    try {
      const form = new FormData();
      form.set("setup", JSON.stringify(setup));
      form.set("question", JSON.stringify(question));
      form.set("file", file);
      if (sessionId) {
        form.set("sessionId", sessionId);
      }
      form.set("questionIndex", String(currentIndex));
      form.set("elapsedSeconds", String(elapsedSeconds));
      const response = await fetch("/api/interview-prep/evaluate-upload", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const result = (await response.json()) as {
        evaluation: InterviewPrepEvaluation;
        transcription: string;
        transcriptionConfidence: "high" | "medium" | "low";
      };
      const uploadAnswer = `Uploaded handwritten solution.\n\nTranscription confidence: ${result.transcriptionConfidence}\n\n${result.transcription}`;
      const nextAttempts = [
        ...attempts,
        {
          answer: uploadAnswer,
          elapsedSeconds,
          evaluation: result.evaluation,
          question,
          skipped: false,
          status: "completed" as const,
        },
      ];
      setAttempts(nextAttempts);
      if (nextAttempts.length >= setup.questionCount) {
        setStage("complete");
      } else {
        await loadQuestion(nextAttempts.length, nextAttempts, sessionId);
      }
    } catch (err) {
      setError(errorMessage(err, "Could not evaluate uploaded solution."));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function resetSession() {
    setAnswer("");
    setAttempts([]);
    setError(null);
    setQuestion(null);
    setSecondsLeft(0);
    setSelectedHistory(null);
    setSessionId(null);
    setStage("setup");
    void loadSessions();
  }

  async function openHistorySession(id: string) {
    try {
      setError(null);
      const response = await fetch(`/api/interview-prep/sessions/${id}`);
      if (!response.ok) {
        throw new Error(await readApiError(response));
      }
      const data = (await response.json()) as { session: InterviewPrepSession };
      setSelectedHistory(data.session);
    } catch (err) {
      setError(errorMessage(err, "Could not open interview history."));
    }
  }

  return (
    <PageShell width="wide">
      <PageHeader
        accent="emerald"
        description="Run timed, one-way mock interviews with role-specific questions, scoring, and coding practice."
        icon={Brain}
        title="Demo Interview"
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-5">
        {selectedHistory ? (
          <HistoryReport
            onBack={() => setSelectedHistory(null)}
            session={selectedHistory}
          />
        ) : stage === "setup" ? (
          <>
            <SetupPanel setup={setup} setSetup={setSetup} onStart={startInterview} />
            <HistoryPanel
              history={history}
              onOpen={(sessionId) => {
                void openHistorySession(sessionId);
              }}
            />
          </>
        ) : null}

        {!selectedHistory && stage !== "setup" ? (
          <div className={surfaceCardElevated}>
            <div className="border-b border-[var(--cp-border-soft)] px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                    Question {Math.min(currentIndex + 1, setup.questionCount)} of{" "}
                    {setup.questionCount}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--cp-text-primary)]">
                    {question?.title ?? "Preparing question..."}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={question?.type === "coding" ? "violet" : "sky"}>
                    {question?.type ?? "loading"}
                  </Badge>
                  <Badge tone={secondsLeft < 30 ? "amber" : "neutral"}>
                    <Clock className="mr-1 h-3 w-3" />
                    {formatTime(secondsLeft)}
                  </Badge>
                </div>
              </div>
            </div>

            {stage === "loading_question" || stage === "evaluating" ? (
              <div className="px-5 py-10 text-sm text-[var(--cp-text-muted)]">
                {stage === "evaluating"
                  ? "Scoring and locking your answer..."
                  : "Preparing the next interview step..."}
              </div>
            ) : null}

            {stage === "answering" && question ? (
              <div className="space-y-4 px-5 py-5">
                <p className="whitespace-pre-wrap rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm leading-6 text-sky-950">
                  {question.prompt}
                </p>
                <textarea
                  className={`${inputFieldSky} min-h-44 resize-y`}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder={
                    question.type === "coding"
                      ? "Write your approach and code here, or upload handwritten code."
                      : "Write your answer. Once submitted, it is locked."
                  }
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className={`${btnPrimarySky} h-10 rounded-xl px-4`}
                    type="button"
                    onClick={() => void submitAnswer()}
                  >
                    Submit answer
                  </button>
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] px-4 text-sm font-semibold text-[var(--cp-text-secondary)] hover:bg-[var(--cp-surface-hover)]"
                    type="button"
                    onClick={() => void submitAnswer({ skipped: true })}
                  >
                    <SkipForward className="h-4 w-4" />
                    Skip for 0
                  </button>
                  {question.type === "coding" ? (
                    <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-800 hover:bg-sky-100">
                      <FileUp className="h-4 w-4" />
                      {uploading ? "Evaluating..." : "Upload handwritten code"}
                      <input
                        className="hidden"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                        disabled={uploading}
                        onChange={(event) => void handleUpload(event)}
                      />
                    </label>
                  ) : null}
                </div>
              </div>
            ) : null}

            {stage === "complete" && attempts.length ? (
              <FinalReport
                attempts={attempts}
                averageScore={averageScore}
                onReset={resetSession}
              />
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        </section>

        <aside className="space-y-4">
        <div className={surfaceCardElevated}>
          <div className="px-4 py-4">
            <p className="text-sm font-semibold text-[var(--cp-text-primary)]">
              Session progress
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-sky-100">
              <div
                className="h-full rounded-full bg-sky-600"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Metric label="Completed" value={`${attempts.length}/${setup.questionCount}`} />
              <Metric label="Avg score" value={`${averageScore}/10`} />
            </div>
          </div>
        </div>

        <div className={surfaceCardElevated}>
          <div className="border-b border-[var(--cp-border-soft)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--cp-text-primary)]">
              Locked answers
            </p>
            <p className="mt-1 text-xs text-[var(--cp-text-muted)]">
              Submitted or skipped questions cannot be edited.
            </p>
          </div>
          <div className="space-y-2 p-3">
            {Array.from({ length: setup.questionCount }).map((_, index) => {
              const attempt = attempts[index];
              return (
                <div
                  className={`rounded-xl border px-3 py-2 text-xs ${
                    attempt
                      ? "border-sky-100 bg-sky-50 text-sky-900"
                      : index === attempts.length && stage !== "setup"
                        ? "border-amber-200 bg-amber-50 text-amber-900"
                        : "border-[var(--cp-border)] bg-[var(--cp-surface)] text-[var(--cp-text-muted)]"
                  }`}
                  key={index}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">Q{index + 1}</span>
                    <span>
                      {attempt
                        ? attempt.skipped
                          ? "Skipped - 0"
                          : `${attempt.evaluation.score}/10`
                        : index === attempts.length && stage !== "setup"
                          ? "Current"
                          : "Pending"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </aside>
      </div>
    </PageShell>
  );
}


function SetupPanel({
  onStart,
  setSetup,
  setup,
}: {
  onStart: () => Promise<void>;
  setSetup: (value: InterviewPrepSetup) => void;
  setup: InterviewPrepSetup;
}) {
  const selectedRole = useMemo(
    () => INTERVIEW_PREP_ROLES.find((role) => role.id === setup.roleId) ?? INTERVIEW_PREP_ROLES[0],
    [setup.roleId],
  );

  function patch(partial: Partial<InterviewPrepSetup>) {
    setSetup({ ...setup, ...partial });
  }

  return (
    <div className={`${surfaceCardElevated} p-5`}>
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-900/20">
          <Brain className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-[var(--cp-text-primary)]">
            Create interview session
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--cp-text-muted)]">
            Choose a fixed role family, then optionally type the exact title you
            are targeting. The session runs forward only with timed questions.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cp-text-muted)]">
            Role family
          </span>
          <select
            className={inputFieldSky}
            value={setup.roleId}
            onChange={(event) => {
              const role =
                INTERVIEW_PREP_ROLES.find((item) => item.id === event.target.value) ??
                INTERVIEW_PREP_ROLES[0];
              patch({ roleId: role.id, targetRole: role.label });
            }}
          >
            {INTERVIEW_PREP_ROLES.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label} ({role.aliases.slice(0, 2).join(", ")})
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cp-text-muted)]">
            Specific target title
          </span>
          <input
            className={inputFieldSky}
            value={setup.targetRole}
            onChange={(event) => patch({ targetRole: event.target.value })}
            placeholder="ML Engineer Intern"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cp-text-muted)]">
            Preparation type
          </span>
          <select
            className={inputFieldSky}
            value={setup.type}
            onChange={(event) => patch({ type: event.target.value as InterviewType })}
          >
            {INTERVIEW_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cp-text-muted)]">
            Difficulty
          </span>
          <select
            className={inputFieldSky}
            value={setup.difficulty}
            onChange={(event) =>
              patch({ difficulty: event.target.value as InterviewDifficulty })
            }
          >
            {INTERVIEW_DIFFICULTIES.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cp-text-muted)]">
            Questions
          </span>
          <select
            className={inputFieldSky}
            value={setup.questionCount}
            onChange={(event) => patch({ questionCount: Number(event.target.value) })}
          >
            {[5, 6, 7, 8, 9, 10].map((count) => (
              <option key={count} value={count}>
                {count} questions
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cp-text-muted)]">
            Focus areas
          </span>
          <input
            className={inputFieldSky}
            value={setup.focusAreas.join(", ")}
            onChange={(event) =>
              patch({
                focusAreas: event.target.value
                  .split(",")
                  .map((area) => area.trim())
                  .filter(Boolean),
              })
            }
            placeholder="arrays, API design, STAR stories"
          />
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-sky-950">
        <p className="font-semibold">Role prompt focus</p>
        <p className="mt-1 leading-6">{selectedRole.promptFocus}</p>
      </div>

      <button
        className={`${btnPrimarySky} mt-5 h-11 rounded-xl px-5`}
        type="button"
        onClick={() => void onStart()}
      >
        <Play className="h-4 w-4" />
        Start timed interview
      </button>
    </div>
  );
}

function HistoryPanel({
  history,
  onOpen,
}: {
  history: InterviewPrepSession[];
  onOpen: (sessionId: string) => void;
}) {
  return (
    <div className={`${surfaceCardElevated} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--cp-text-primary)]">
            Interview history
          </h2>
          <p className="mt-1 text-sm text-[var(--cp-text-muted)]">
            Review completed sessions, mistakes, scores, and follow up in chat.
          </p>
        </div>
        <Badge tone="neutral">{history.length} saved</Badge>
      </div>

      {history.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {history.map((session) => (
            <button
              className="rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] px-4 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50/60"
              key={session.id}
              type="button"
              onClick={() => onOpen(session.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--cp-text-primary)]">
                  {session.setup.targetRole}
                </span>
                <Badge tone="sky">{Math.round(session.averageScore)}/10</Badge>
              </div>
              <p className="mt-1 text-xs capitalize text-[var(--cp-text-muted)]">
                {session.setup.type} - {session.setup.difficulty} -{" "}
                {session.questionCount} questions
              </p>
              <p className="mt-2 text-xs text-[var(--cp-text-muted)]">
                Completed {session.completedAt ? formatDate(session.completedAt) : "recently"}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-[var(--cp-border)] bg-[var(--cp-surface)] px-4 py-6 text-sm text-[var(--cp-text-muted)]">
          No completed interviews yet.
        </div>
      )}
    </div>
  );
}

function HistoryReport({
  onBack,
  session,
}: {
  onBack: () => void;
  session: InterviewPrepSession;
}) {
  return (
    <div className={surfaceCardElevated}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--cp-border-soft)] px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            Saved interview report
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--cp-text-primary)]">
            {session.setup.targetRole}
          </h2>
          <p className="mt-1 text-sm text-[var(--cp-text-muted)]">
            Average score {Math.round(session.averageScore)}/10 -{" "}
            {session.questionCount} questions
          </p>
        </div>
        <button
          className="h-10 rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] px-4 text-sm font-semibold text-[var(--cp-text-secondary)] hover:bg-[var(--cp-surface-hover)]"
          type="button"
          onClick={onBack}
        >
          Back to setup
        </button>
      </div>
      <FinalReport
        attempts={session.attempts}
        averageScore={Math.round(session.averageScore)}
        historyMode
        onReset={onBack}
      />
    </div>
  );
}

function FinalReport({
  attempts,
  averageScore,
  historyMode = false,
  onReset,
}: {
  attempts: InterviewPrepAttempt[];
  averageScore: number;
  historyMode?: boolean;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4 px-5 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-sky-950">
            Interview complete
          </p>
          <p className="text-xs text-sky-800">
            Average score: {averageScore}/10 across {attempts.length} locked answers
          </p>
        </div>
        <CheckCircle2 className="h-5 w-5 text-sky-700" />
      </div>

      {attempts.map((attempt, index) => (
        <article
          className="rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] px-4 py-4"
          key={attempt.question.id}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                Question {index + 1} - {attempt.question.type}
              </p>
              <h3 className="mt-1 text-base font-semibold text-[var(--cp-text-primary)]">
                {attempt.question.title}
              </h3>
            </div>
            <Badge tone={attempt.evaluation.score <= 2 ? "amber" : "sky"}>
              {attempt.evaluation.score}/10
            </Badge>
          </div>

          <div className="mt-3 grid gap-3">
            <ReportBlock
              title="Question asked"
              text={attempt.question.prompt}
              variant="question"
            />
            <ReportBlock
              title="What was expected"
              text={attempt.evaluation.expectedAnswer}
              variant="expected"
            />
            <ReportBlock
              title="What you answered"
              text={attempt.skipped ? "Skipped. No answer submitted." : attempt.answer}
              variant="answer"
            />
            <ReportBlock
              title="Evaluation"
              text={attempt.evaluation.answerAssessment}
              variant="evaluation"
            />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <FeedbackList
              title="Strengths"
              items={attempt.evaluation.strengths}
              variant="strengths"
            />
            <FeedbackList
              title="Missing"
              items={attempt.evaluation.missing}
              variant="missing"
            />
            <FeedbackList
              title="CV evidence"
              items={attempt.evaluation.cvEvidence}
              variant="cvEvidence"
            />
          </div>

          <ReportBlock
            title="Detailed feedback"
            text={attempt.evaluation.feedback}
            variant="feedback"
            expanded
          />
        </article>
      ))}

      <div className="flex flex-wrap gap-2">
        <button
          className={`${btnPrimarySky} h-10 rounded-xl px-4`}
          type="button"
          onClick={onReset}
        >
          <RotateCcw className="h-4 w-4" />
          {historyMode ? "Back to history" : "Start another session"}
        </button>
      </div>
    </div>
  );
}

type ReportVariant =
  | "question"
  | "expected"
  | "answer"
  | "evaluation"
  | "feedback";

type FeedbackVariant = "strengths" | "missing" | "cvEvidence";

type SectionTone = {
  accent: string;
  bg: string;
  border: string;
  title: string;
};

const REPORT_TONES: Record<ReportVariant, SectionTone> = {
  question: {
    border: "border-sky-200 dark:border-sky-500/35",
    bg: "bg-sky-50 dark:bg-sky-950/45",
    title: "text-sky-900 dark:text-sky-300",
    accent: "bg-sky-500",
  },
  expected: {
    border: "border-violet-200 dark:border-violet-500/35",
    bg: "bg-violet-50 dark:bg-violet-950/45",
    title: "text-violet-900 dark:text-violet-300",
    accent: "bg-violet-500",
  },
  answer: {
    border: "border-zinc-300 dark:border-zinc-500/35",
    bg: "bg-zinc-50 dark:bg-zinc-900/55",
    title: "text-zinc-900 dark:text-zinc-200",
    accent: "bg-zinc-400 dark:bg-zinc-500",
  },
  evaluation: {
    border: "border-amber-200 dark:border-amber-500/35",
    bg: "bg-amber-50 dark:bg-amber-950/45",
    title: "text-amber-950 dark:text-amber-300",
    accent: "bg-amber-500",
  },
  feedback: {
    border: "border-indigo-200 dark:border-indigo-500/35",
    bg: "bg-indigo-50 dark:bg-indigo-950/45",
    title: "text-indigo-900 dark:text-indigo-300",
    accent: "bg-indigo-500",
  },
};

const FEEDBACK_TONES: Record<FeedbackVariant, SectionTone> = {
  strengths: {
    border: "border-emerald-200 dark:border-emerald-500/35",
    bg: "bg-emerald-50 dark:bg-emerald-950/45",
    title: "text-emerald-900 dark:text-emerald-300",
    accent: "bg-emerald-500",
  },
  missing: {
    border: "border-rose-200 dark:border-rose-500/35",
    bg: "bg-rose-50 dark:bg-rose-950/45",
    title: "text-rose-900 dark:text-rose-300",
    accent: "bg-rose-500",
  },
  cvEvidence: {
    border: "border-cyan-200 dark:border-cyan-500/35",
    bg: "bg-cyan-50 dark:bg-cyan-950/45",
    title: "text-cyan-900 dark:text-cyan-300",
    accent: "bg-cyan-500",
  },
};

function ReportBlock({
  text,
  title,
  variant,
  expanded = false,
}: {
  text: string;
  title: string;
  variant: ReportVariant;
  expanded?: boolean;
}) {
  const tone = REPORT_TONES[variant];

  return (
    <div
      className={`relative rounded-xl border px-4 py-3 pl-5 ${tone.border} ${tone.bg}`}
    >
      <span
        aria-hidden
        className={`absolute bottom-3 left-0 top-3 w-1 rounded-full ${tone.accent}`}
      />
      <p className={`text-sm font-semibold ${tone.title}`}>{title}</p>
      <div
        className={`mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--cp-text-secondary)] ${
          expanded
            ? "min-h-[24rem] max-h-[min(52.5vh,36rem)] overflow-y-auto overscroll-y-contain pr-2"
            : "max-h-56 overflow-y-auto"
        }`}
      >
        {text || "None provided."}
      </div>
    </div>
  );
}

function FeedbackList({
  items,
  title,
  variant,
}: {
  items: string[];
  title: string;
  variant: FeedbackVariant;
}) {
  const tone = FEEDBACK_TONES[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border px-4 py-3 pl-5 ${tone.border} ${tone.bg}`}
    >
      <span
        aria-hidden
        className={`absolute bottom-3 left-0 top-3 w-1 rounded-full ${tone.accent}`}
      />
      <p className={`text-sm font-semibold ${tone.title}`}>{title}</p>
      {items.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--cp-text-secondary)]">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[var(--cp-text-muted)]">None noted.</p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cp-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-[var(--cp-text-primary)]">{value}</p>
    </div>
  );
}

async function requestJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return response.json() as Promise<T>;
}

async function saveSessionProgress({
  currentIndex,
  secondsLeft,
  sessionId,
}: {
  currentIndex: number;
  secondsLeft: number;
  sessionId: string;
}) {
  try {
    await fetch(`/api/interview-prep/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentIndex,
        secondsLeft,
        status: "in_progress",
      }),
      keepalive: true,
    });
  } catch {
    // Timer persistence is best-effort; normal submit still persists the attempt.
  }
}

async function readApiError(response: Response) {
  try {
    const data = (await response.json()) as { detail?: string };
    return data.detail ?? "Request failed.";
  } catch {
    return "Request failed.";
  }
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
