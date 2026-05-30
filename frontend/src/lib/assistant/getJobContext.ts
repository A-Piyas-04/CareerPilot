import { createClient } from "@/lib/supabase/server";

export type JobContextResult = {
  jobId: string;
  title: string;
  company: string | null;
  location: string | null;
  description: string;
  fitScore: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  text: string;
};

export async function getJobContext({
  userId,
  jobId,
}: {
  userId: string;
  jobId: string;
}): Promise<JobContextResult | null> {
  if (!isUuid(jobId)) {
    return null;
  }

  const supabase = await createClient();

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, title, company, location, description, requirements")
    .eq("id", jobId)
    .maybeSingle();

  if (jobError || !job) {
    return null;
  }

  const { data: match } = await supabase
    .from("job_matches")
    .select("fit_score, matched_skills, missing_skills")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .order("fit_score", { ascending: false })
    .limit(1)
    .maybeSingle();

  const description = [job.description, job.requirements]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  const matchedSkills = (match?.matched_skills as string[] | null) ?? [];
  const missingSkills = (match?.missing_skills as string[] | null) ?? [];
  const fitScore =
    typeof match?.fit_score === "number" ? match.fit_score : null;

  const lines = [
    `Title: ${job.title}`,
    job.company ? `Company: ${job.company}` : null,
    job.location ? `Location: ${job.location}` : null,
    fitScore !== null ? `Fit score: ${fitScore.toFixed(0)}%` : null,
    matchedSkills.length
      ? `Matched skills: ${matchedSkills.join(", ")}`
      : null,
    missingSkills.length ? `Skill gaps: ${missingSkills.join(", ")}` : null,
    description ? `Description:\n${description.slice(0, 4000)}` : null,
  ].filter(Boolean);

  return {
    jobId: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    description,
    fitScore,
    matchedSkills,
    missingSkills,
    text: lines.join("\n"),
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
