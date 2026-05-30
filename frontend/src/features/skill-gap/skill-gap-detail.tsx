"use client";

import Link from "next/link";
import { Map } from "lucide-react";

import { ListCardSkeleton } from "@/components/ui";
import { buildRoadmapHref } from "@/features/jobs/job-actions";
import type { MatchSummary } from "@/features/jobs/types";
import type { SkillGapAnalysisDetail } from "@/lib/career-api";

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
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!analysis) {
    return (
      <p className="text-sm text-zinc-500">
        Select an analysis from the list to view missing skills and recommendations.
      </p>
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

      <SkillChipGroup title="Skills you have" skills={analysis.current_skills} tone="green" />
      <SkillChipGroup
        title="Required skills"
        skills={analysis.required_skills}
        tone="neutral"
      />
      <SkillChipGroup title="Gaps to close" skills={analysis.missing_skills} tone="amber" />

      {learningPlan.length > 0 ? (
        <section>
          <h3 className="text-sm font-semibold text-zinc-900">Learning priorities</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-700">
            {learningPlan.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {analysis.missing_skills.length > 0 ? (
        <Link
          href={buildRoadmapHref(roadmapMatch)}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
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
  const chipClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-800"
      : tone === "amber"
        ? "bg-amber-50 text-amber-900"
        : "bg-zinc-100 text-zinc-800";

  return (
    <section>
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      {skills.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span
              key={skill}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${chipClass}`}
            >
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
