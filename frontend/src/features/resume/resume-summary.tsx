"use client";

import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { useMemo } from "react";

import type { ResumeDetail } from "./types";
import { formatResumeDate, truncateText } from "./types";

type ResumeSummaryProps = {
  detail: ResumeDetail | undefined;
  isLoading: boolean;
  error: Error | null;
  hasResumes: boolean;
};

function groupSkillsByCategory(
  skills: ResumeDetail["skills"],
): Map<string, ResumeDetail["skills"]> {
  const map = new Map<string, ResumeDetail["skills"]>();
  for (const skill of skills) {
    const key = skill.category?.trim() || "Other";
    const existing = map.get(key) ?? [];
    existing.push(skill);
    map.set(key, existing);
  }
  return map;
}

export function ResumeSummary({
  detail,
  isLoading,
  error,
  hasResumes,
}: ResumeSummaryProps) {
  const groupedSkills = useMemo(
    () => (detail ? groupSkillsByCategory(detail.skills) : new Map()),
    [detail],
  );

  if (!hasResumes) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-950">Resume overview</h2>
        <div className="mt-6 flex flex-col items-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
          <FileText className="h-10 w-10 text-zinc-300" />
          <p className="mt-3 text-sm font-medium text-zinc-800">
            No resume uploaded yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Upload a PDF or DOCX to extract sections, skills, and RAG-ready
            chunks.
          </p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-950">Resume overview</h2>
        <div className="mt-6 flex items-center gap-2 text-sm text-zinc-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading resume details…
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-950">Resume overview</h2>
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message}
        </p>
      </section>
    );
  }

  if (!detail) {
    return null;
  }

  const { resume, sections, skills, chunk_count } = detail;
  const isProcessing =
    resume.status === "processing" || resume.status === "uploaded";
  const isFailed = resume.status === "failed";

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-950">Resume overview</h2>
        {resume.is_active ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            Active
          </span>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">File</dt>
          <dd className="font-medium text-zinc-900">{resume.file_name}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Status</dt>
          <dd className="font-medium capitalize text-zinc-900">
            {resume.status}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Uploaded</dt>
          <dd className="font-medium text-zinc-900">
            {formatResumeDate(resume.created_at)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Chunks</dt>
          <dd className="font-medium text-zinc-900">{chunk_count}</dd>
        </div>
      </dl>

      {isProcessing ? (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          Processing your CV…
        </div>
      ) : null}

      {isFailed ? (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{resume.error_message ?? "Resume processing failed."}</p>
        </div>
      ) : null}

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-zinc-900">
          Extracted sections
          <span className="ml-2 font-normal text-zinc-500">
            ({sections.length})
          </span>
        </h3>
        {sections.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No sections detected yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sections.map((section) => (
              <li
                className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2"
                key={section.id}
              >
                <p className="text-sm font-medium text-zinc-900">
                  {section.section_name}
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  {truncateText(section.content, 140)}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {section.content.length} characters
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-zinc-900">
          Extracted skills
          <span className="ml-2 font-normal text-zinc-500">
            ({skills.length})
          </span>
        </h3>
        {skills.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No skills extracted yet.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {[...groupedSkills.entries()].map(([category, categorySkills]) => (
              <div key={category}>
                {groupedSkills.size > 1 ? (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {category}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((skill) => (
                    <span
                      className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-900"
                      key={skill.id}
                    >
                      {skill.skill_name}
                      {skill.proficiency ? (
                        <span className="text-indigo-600">
                          {" "}
                          · {skill.proficiency}
                        </span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
