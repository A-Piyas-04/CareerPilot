import type {
  InterviewDifficulty,
  InterviewType,
} from "@/lib/types/assistant";

export type InterviewPrepRole = {
  aliases: string[];
  id: string;
  label: string;
  promptFocus: string;
  technicalAreas: string[];
};

export const INTERVIEW_PREP_ROLES: InterviewPrepRole[] = [
  {
    aliases: ["ML", "Machine Learning", "ML Engineer"],
    id: "machine-learning-engineer",
    label: "Machine Learning Engineer",
    promptFocus:
      "machine learning fundamentals, model evaluation, Python, data preprocessing, APIs for ML systems, and honest gaps around ML libraries if absent from the CV",
    technicalAreas: ["python", "ml basics", "model evaluation", "data pipelines"],
  },
  {
    aliases: ["Backend Dev", "Server Dev", "API Developer"],
    id: "backend-developer",
    label: "Backend Developer",
    promptFocus:
      "API design, databases, authentication, backend debugging, scalability basics, and production-minded communication",
    technicalAreas: ["apis", "databases", "system design basics", "debugging"],
  },
  {
    aliases: ["Frontend Dev", "React Dev", "UI Engineer"],
    id: "frontend-developer",
    label: "Frontend Developer",
    promptFocus:
      "React, component design, state management, accessibility, responsive UI, browser behavior, and user-facing debugging",
    technicalAreas: ["react", "javascript", "accessibility", "state management"],
  },
  {
    aliases: ["Full Stack", "Fullstack"],
    id: "full-stack-developer",
    label: "Full Stack Developer",
    promptFocus:
      "frontend-backend integration, API contracts, database-backed features, deployment basics, and end-to-end ownership",
    technicalAreas: ["react", "apis", "databases", "deployment"],
  },
  {
    aliases: ["Data Engineer", "DE"],
    id: "data-engineer",
    label: "Data Engineer",
    promptFocus:
      "SQL, ETL/ELT, data modeling, batch pipelines, data quality, orchestration, and scalable storage concepts",
    technicalAreas: ["sql", "pipelines", "data modeling", "data quality"],
  },
  {
    aliases: ["Data Analyst", "BI Analyst"],
    id: "data-analyst",
    label: "Data Analyst",
    promptFocus:
      "SQL, metrics, dashboards, business reasoning, statistical interpretation, and communicating insights clearly",
    technicalAreas: ["sql", "analytics", "statistics", "dashboards"],
  },
  {
    aliases: ["DevOps", "SRE", "Platform"],
    id: "devops-engineer",
    label: "DevOps Engineer",
    promptFocus:
      "Docker, CI/CD, cloud fundamentals, monitoring, incident response, infrastructure reasoning, and reliability tradeoffs",
    technicalAreas: ["docker", "ci/cd", "cloud", "monitoring"],
  },
  {
    aliases: ["Mobile Dev", "Android", "iOS"],
    id: "mobile-developer",
    label: "Mobile Developer",
    promptFocus:
      "mobile app architecture, API integration, offline behavior, performance, platform constraints, and release workflows",
    technicalAreas: ["mobile architecture", "api integration", "performance"],
  },
  {
    aliases: ["QA", "SDET", "Test Automation"],
    id: "qa-automation-engineer",
    label: "QA Automation Engineer",
    promptFocus:
      "test planning, automation strategy, edge cases, bug reporting, CI testing, and quality ownership",
    technicalAreas: ["test automation", "edge cases", "ci testing"],
  },
  {
    aliases: ["Cybersecurity", "Security Analyst"],
    id: "cybersecurity-analyst",
    label: "Cybersecurity Analyst",
    promptFocus:
      "security fundamentals, threat modeling, web vulnerabilities, incident triage, access control, and risk communication",
    technicalAreas: ["security basics", "web vulnerabilities", "risk analysis"],
  },
  {
    aliases: ["Cloud Engineer"],
    id: "cloud-engineer",
    label: "Cloud Engineer",
    promptFocus:
      "cloud services, networking basics, deployment, reliability, cost awareness, and infrastructure troubleshooting",
    technicalAreas: ["cloud", "networking", "deployment", "reliability"],
  },
  {
    aliases: ["AI Engineer", "GenAI Engineer"],
    id: "ai-engineer",
    label: "AI Engineer",
    promptFocus:
      "LLM application design, prompt quality, RAG concepts, API integration, evaluation, and grounding claims in real project evidence",
    technicalAreas: ["llms", "rag", "prompting", "evaluation"],
  },
  {
    aliases: ["Product Manager", "PM"],
    id: "product-manager",
    label: "Product Manager",
    promptFocus:
      "product thinking, prioritization, user problems, metrics, tradeoffs, stakeholder communication, and execution",
    technicalAreas: ["product sense", "metrics", "prioritization"],
  },
  {
    aliases: ["UI/UX", "UX Designer", "Product Designer"],
    id: "ui-ux-designer",
    label: "UI/UX Designer",
    promptFocus:
      "user research, information architecture, design critique, accessibility, prototyping, and communicating design decisions",
    technicalAreas: ["ux research", "design critique", "accessibility"],
  },
  {
    aliases: ["Software Engineer Intern", "SWE Intern"],
    id: "software-engineer-intern",
    label: "Software Engineer Intern",
    promptFocus:
      "CS fundamentals, projects, teamwork, debugging, learning speed, code clarity, and internship readiness",
    technicalAreas: ["data structures", "algorithms", "projects", "debugging"],
  },
];

export const INTERVIEW_TYPES: InterviewType[] = [
  "behavioral",
  "technical",
  "coding",
  "mixed",
];

export const INTERVIEW_DIFFICULTIES: InterviewDifficulty[] = [
  "easy",
  "medium",
  "hard",
];

export function findInterviewRole(roleId: string) {
  return (
    INTERVIEW_PREP_ROLES.find((role) => role.id === roleId) ??
    INTERVIEW_PREP_ROLES[0]
  );
}
