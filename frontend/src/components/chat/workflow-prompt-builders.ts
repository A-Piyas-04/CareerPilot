export type RoadmapWizardValues = {
  targetRole: string;
  durationWeeks: number;
  constraints: string;
  jobDescription?: string;
};

export type CoverLetterWizardValues = {
  jobTitle: string;
  company: string;
  jobDescription: string;
  tone: "professional" | "confident" | "concise" | "enthusiastic";
};

export type ReadinessWizardValues = {
  targetRole: string;
  jobDescription: string;
};

export function buildRoadmapPrompt(values: RoadmapWizardValues): string {
  const constraints = values.constraints.trim() || "none specified";
  const jobPart = values.jobDescription?.trim()
    ? ` Optional job context: ${values.jobDescription.trim()}`
    : "";

  return `Build me a ${values.durationWeeks}-week roadmap to become job-ready for ${values.targetRole.trim()}. Use my CV as grounding. My constraints are: ${constraints}. Structure it weekly with tasks, resources, and milestones.${jobPart}`;
}

export function buildCoverLetterPrompt(values: CoverLetterWizardValues): string {
  return `Draft a ${values.tone} cover letter for ${values.jobTitle.trim()} at ${values.company.trim()}. Use my CV evidence and this job description: ${values.jobDescription.trim()}`;
}

export function buildReadinessPrompt(values: ReadinessWizardValues): string {
  return `Am I ready for this ${values.targetRole.trim()}? Compare my CV against this job description, give a verdict, strengths, missing skills, and next actions: ${values.jobDescription.trim()}`;
}
