"use client";

import {
  ClipboardCheck,
  FileText,
  Map,
  Sparkles,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui";
import { surfaceCardElevated } from "@/lib/ui-theme";

import type { ActiveJobContext } from "./ChatWorkspace";
import {
  buildCoverLetterPrompt,
  buildReadinessPrompt,
  buildRoadmapPrompt,
} from "./workflow-prompt-builders";
import {
  WizardField,
  WizardInput,
  WizardSelect,
  WizardTextarea,
  WorkflowWizardModal,
} from "./workflow-wizard-modal";

type WorkflowType = "roadmap" | "cover_letter" | "readiness" | null;

type Props = {
  jobContext?: ActiveJobContext | null;
  disabled?: boolean;
  compact?: boolean;
  onSubmitPrompt: (prompt: string) => Promise<void>;
};

const WORKFLOW_CARDS = [
  {
    id: "roadmap" as const,
    title: "Roadmap Wizard",
    description: "Build a weekly plan to become job-ready.",
    icon: Map,
    badge: "Roadmap",
    badgeTone: "violet" as const,
  },
  {
    id: "cover_letter" as const,
    title: "Cover Letter Wizard",
    description: "Draft a tailored cover letter from your CV.",
    icon: FileText,
    badge: "Cover Letter",
    badgeTone: "sky" as const,
  },
  {
    id: "readiness" as const,
    title: "Readiness Wizard",
    description: "Check fit against a role and job description.",
    icon: ClipboardCheck,
    badge: "Readiness",
    badgeTone: "emerald" as const,
  },
];

export function GuidedWorkflows({
  jobContext,
  disabled,
  compact,
  onSubmitPrompt,
}: Props) {
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitPrompt(prompt: string) {
    setIsSubmitting(true);
    try {
      await onSubmitPrompt(prompt);
      setActiveWorkflow(null);
      toast.success("Prompt sent to assistant.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send prompt.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className={compact ? "" : "text-left"}>
        {!compact ? (
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-zinc-950">
                Guided workflows
              </h4>
              <p className="text-xs text-zinc-500">
                Step-by-step wizards grounded in your CV
              </p>
            </div>
          </div>
        ) : (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-700/80">
            Guided workflows
          </p>
        )}
        <div
          className={
            compact
              ? "flex flex-wrap gap-2"
              : "grid gap-3 sm:grid-cols-3"
          }
        >
          {WORKFLOW_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              disabled={disabled}
              onClick={() => setActiveWorkflow(card.id)}
              className={
                compact
                  ? "inline-flex h-9 items-center gap-2 rounded-full border border-sky-200/80 bg-white px-3 text-xs font-semibold text-sky-900 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 disabled:opacity-50"
                  : `${surfaceCardElevated} group p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-900/10 disabled:opacity-50 disabled:hover:translate-y-0`
              }
            >
              <card.icon
                className={
                  compact
                    ? "h-3.5 w-3.5 text-sky-600"
                    : "mb-3 h-5 w-5 text-sky-600 transition group-hover:text-sky-700"
                }
              />
              {compact ? (
                <span>{card.title.replace(" Wizard", "")}</span>
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-zinc-950 group-hover:text-sky-950">
                      {card.title}
                    </span>
                    <Badge tone={card.badgeTone}>{card.badge}</Badge>
                  </div>
                  <p className="text-xs leading-5 text-zinc-600">
                    {card.description}
                  </p>
                </>
              )}
            </button>
          ))}
        </div>
      </section>

      <RoadmapWizard
        isOpen={activeWorkflow === "roadmap"}
        jobContext={jobContext}
        isSubmitting={isSubmitting}
        onClose={() => setActiveWorkflow(null)}
        onSubmit={submitPrompt}
      />
      <CoverLetterWizard
        isOpen={activeWorkflow === "cover_letter"}
        jobContext={jobContext}
        isSubmitting={isSubmitting}
        onClose={() => setActiveWorkflow(null)}
        onSubmit={submitPrompt}
      />
      <ReadinessWizard
        isOpen={activeWorkflow === "readiness"}
        jobContext={jobContext}
        isSubmitting={isSubmitting}
        onClose={() => setActiveWorkflow(null)}
        onSubmit={submitPrompt}
      />
    </>
  );
}

function RoadmapWizard({
  isOpen,
  jobContext,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  jobContext?: ActiveJobContext | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<void>;
}) {
  const [targetRole, setTargetRole] = useState(jobContext?.title ?? "");
  const [durationWeeks, setDurationWeeks] = useState("12");
  const [constraints, setConstraints] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!targetRole.trim()) {
      toast.error("Enter a target role.");
      return;
    }

    const weeks = Number(durationWeeks);
    if (!Number.isFinite(weeks) || weeks < 1 || weeks > 52) {
      toast.error("Duration must be between 1 and 52 weeks.");
      return;
    }

    await onSubmit(
      buildRoadmapPrompt({
        targetRole,
        durationWeeks: weeks,
        constraints,
        jobDescription: jobDescription || undefined,
      }),
    );
  }

  return (
    <WorkflowWizardModal
      isOpen={isOpen}
      title="Roadmap Wizard"
      description="Generate a structured weekly roadmap grounded in your CV."
      isSubmitting={isSubmitting}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <WizardField label="Target role" hint="e.g. Backend Engineer, Data Analyst">
        <WizardInput
          value={targetRole}
          onChange={(event) => setTargetRole(event.target.value)}
          placeholder="Backend Engineer"
          required
        />
      </WizardField>
      <WizardField label="Duration (weeks)" hint="Default is 12 weeks">
        <WizardInput
          type="number"
          min={1}
          max={52}
          value={durationWeeks}
          onChange={(event) => setDurationWeeks(event.target.value)}
          required
        />
      </WizardField>
      <WizardField
        label="Current focus / constraints"
        hint="Time budget, skills to prioritize, location limits, etc."
      >
        <WizardTextarea
          value={constraints}
          onChange={(event) => setConstraints(event.target.value)}
          placeholder="I can study 8 hours/week and need to prioritize Python and system design."
        />
      </WizardField>
      <WizardField
        label="Optional job description"
        hint="Paste a posting or leave blank."
      >
        <WizardTextarea
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Paste a job description if you have one…"
        />
      </WizardField>
    </WorkflowWizardModal>
  );
}

function CoverLetterWizard({
  isOpen,
  jobContext,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  jobContext?: ActiveJobContext | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<void>;
}) {
  const [jobTitle, setJobTitle] = useState(jobContext?.title ?? "");
  const [company, setCompany] = useState(jobContext?.company ?? "");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] =
    useState<"professional" | "confident" | "concise" | "enthusiastic">(
      "professional",
    );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!jobTitle.trim() || !company.trim() || !jobDescription.trim()) {
      toast.error("Job title, company, and job description are required.");
      return;
    }

    await onSubmit(
      buildCoverLetterPrompt({ jobTitle, company, jobDescription, tone }),
    );
  }

  return (
    <WorkflowWizardModal
      isOpen={isOpen}
      title="Cover Letter Wizard"
      description="Draft a cover letter using your CV evidence."
      isSubmitting={isSubmitting}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <WizardField label="Job title">
        <WizardInput
          value={jobTitle}
          onChange={(event) => setJobTitle(event.target.value)}
          placeholder="Software Engineer"
          required
        />
      </WizardField>
      <WizardField label="Company">
        <WizardInput
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          placeholder="Acme Corp"
          required
        />
      </WizardField>
      <WizardField label="Job description">
        <WizardTextarea
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Paste the full job description or key requirements…"
          required
        />
      </WizardField>
      <WizardField label="Tone">
        <WizardSelect
          value={tone}
          onChange={(event) =>
            setTone(
              event.target.value as
                | "professional"
                | "confident"
                | "concise"
                | "enthusiastic",
            )
          }
        >
          <option value="professional">Professional</option>
          <option value="confident">Confident</option>
          <option value="concise">Concise</option>
          <option value="enthusiastic">Enthusiastic</option>
        </WizardSelect>
      </WizardField>
    </WorkflowWizardModal>
  );
}

function ReadinessWizard({
  isOpen,
  jobContext,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  jobContext?: ActiveJobContext | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<void>;
}) {
  const [targetRole, setTargetRole] = useState(jobContext?.title ?? "");
  const [jobDescription, setJobDescription] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!targetRole.trim() || !jobDescription.trim()) {
      toast.error("Target role and job description are required.");
      return;
    }

    await onSubmit(buildReadinessPrompt({ targetRole, jobDescription }));
  }

  return (
    <WorkflowWizardModal
      isOpen={isOpen}
      title="Readiness Wizard"
      description="Compare your CV against a role and get a readiness verdict."
      isSubmitting={isSubmitting}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <WizardField label="Target role or job title">
        <WizardInput
          value={targetRole}
          onChange={(event) => setTargetRole(event.target.value)}
          placeholder="Senior Backend Engineer"
          required
        />
      </WizardField>
      <WizardField label="Job description / requirements">
        <WizardTextarea
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Paste the job description or list of requirements…"
          required
        />
      </WizardField>
    </WorkflowWizardModal>
  );
}
