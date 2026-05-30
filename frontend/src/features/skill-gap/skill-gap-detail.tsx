"use client";

import Link from "next/link";
import { LineChart, Map } from "lucide-react";

import { EmptyState, ListCardSkeleton } from "@/components/ui";
import { buildRoadmapHref } from "@/features/jobs/job-actions";
import type { MatchSummary } from "@/features/jobs/types";
import type { SkillGapAnalysisDetail } from "@/lib/career-api";
import {
  alertError,
  btnPrimarySky,
  chipAmber,
  chipEmerald,
  chipNeutral,
} from "@/lib/ui-theme";

type Props = {
  analysis: SkillGapAnalysisDetail | null | undefined;
  isLoading: boolean;
  error?: string;
};

export function SkillGapDetail({ analysis, isLoading, error }: Props) {
  if (isLoading) {
    return <ListCardSkeleton count={4} />;
  }

  if (error) {
    return <p className={alertError}>{error}</p>;
  }

  if (!analysis) {
    return (
      <EmptyState
        accent="sky"
        className="min-h-48 py-8"
        description="Select an analysis from the list to view missing skills and recommendations."
        icon={LineChart}
        title="No analysis selected"
      />
    );
  }

  const recommendations = analysis.recommendations ?? {};
  const learningPlan = Array.isArray(recommendations.learning_plan)
    ? (recommendations.learning_plan as string[])
    : [];
  const summary =
    typeof recommendations.summary === "string" ? recommendations.summary : null;

  const roadmapMatch: MatchSummary = {
    match_id: null,
    job: {
      id: analysis.job_id ?? "",
      search_id: null,
      title: analysis.target_role ?? "Target role",
      company: null,
      location: null,
      salary_range: null,
      job_type: null,
      deadline: null,
      description: null,
      requirements: null,
      source: null,
      source_url: null,
      raw_data: null,
      created_at: analysis.created_at,
    },
    fit_score: 0,
    matched_skills: analysis.current_skills,
    missing_skills: analysis.missing_skills,
    explanation: "",
    evidence_chunks: [],
    skills_component: 0,
    mean_similarity: 0,
    tracker_application_id: null,
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-950">
          {analysis.target_role ?? "Skill gap analysis"}
        </h2>
        {summary ? <p className="mt-2 text-sm text-zinc-600">{summary}</p> : null}
      </div>

      <SkillChipGroup
        title="Skills you have"
        skills={analysis.current_skills}
        tone="green"
      />
      <SkillChipGroup
        title="Required skills"
        skills={analysis.required_skills}
        tone="neutral"
      />
      <SkillChipGroup title="Gaps to close" skills={analysis.missing_skills} tone="amber" />

      {learningPlan.length > 0 ? (
        <section className="rounded-xl border border-sky-200/80 bg-sky-50/50 p-4">
          <h3 className="text-sm font-semibold text-sky-900">Learning priorities</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-sky-950/80">
            {learningPlan.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {analysis.missing_skills.length > 0 ? (
        <Link href={buildRoadmapHref(roadmapMatch)} className={btnPrimarySky}>
          <Map className="h-4 w-4" />
          Build roadmap from gaps
        </Link>
      ) : null}
    </div>
  );
}

function SkillChipGroup({
  title,
  skills,
  tone,
}: {
  title: string;
  skills: string[];
  tone: "green" | "amber" | "neutral";
}) {
  const cardClass =
    tone === "green"
      ? "border-emerald-200/80 bg-emerald-50/50"
      : tone === "amber"
        ? "border-amber-200/80 bg-amber-50/50"
        : "border-zinc-200/80 bg-zinc-50/60";

  const chipClass =
    tone === "green" ? chipEmerald : tone === "amber" ? chipAmber : chipNeutral;

  return (
    <section className={`rounded-xl border p-4 ${cardClass}`}>
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      {skills.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span key={skill} className={chipClass}>
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">None listed</p>
      )}
    </section>
  );
}
