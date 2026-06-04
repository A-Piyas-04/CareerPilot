import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const EMAIL = "nurenfahmid65@gmail.com";
const FULL_NAME = "Nuren Fahmid";
const SEED_SOURCE = "careerpilot-sample-seed";
const ROOT = resolve(process.cwd(), "..");

function loadRootEnv() {
  const envPath = resolve(ROOT, ".env");
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadRootEnv();
const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function iso(day, time = "09:00:00") {
  return `${day}T${time}+06:00`;
}

function date(day) {
  return day;
}

async function expect(label, promise) {
  const { data, error } = await promise;
  if (error) {
    throw new Error(`${label}: ${error.message}${error.details ? ` (${error.details})` : ""}`);
  }
  return data;
}

async function maybe(label, promise) {
  const { data, error } = await promise;
  if (error) {
    console.warn(`Skipping ${label}: ${error.message}`);
  }
  return data;
}

async function findAuthUserByEmail(email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(`List auth users: ${error.message}`);
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < 1000) break;
  }
  return null;
}

async function ensureAuthUser() {
  const existing = await findAuthUserByEmail(EMAIL);
  if (existing) {
    return { user: existing, created: false };
  }

  const temporaryPassword = `CareerPilot-${randomBytes(12).toString("base64url")}1!`;
  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: FULL_NAME,
    },
  });
  if (error) throw new Error(`Create auth user: ${error.message}`);
  return { user: data.user, created: true };
}

async function selectIds(table, column = "id") {
  const rows = await maybe(
    `select ${table}`,
    supabase.from(table).select(column).eq("user_id", userId),
  );
  return rows?.map((row) => row[column]).filter(Boolean) ?? [];
}

async function clearPreviousSeedData(userId) {
  const applicationIds = await selectIds("applications");

  await maybe("application history", applicationIds.length
    ? supabase.from("application_history").delete().in("application_id", applicationIds)
    : Promise.resolve({ data: null, error: null }));

  await maybe("calendar events", supabase.from("calendar_events").delete().eq("user_id", userId));
  await maybe("tasks", supabase.from("tasks").delete().eq("user_id", userId));
  await maybe("applications", supabase.from("applications").delete().eq("user_id", userId));
  await maybe("cover letters", supabase.from("cover_letters").delete().eq("user_id", userId));
  await maybe("assistant messages", supabase.from("assistant_messages").delete().eq("user_id", userId));
  await maybe("assistant conversations", supabase.from("assistant_conversations").delete().eq("user_id", userId));
  await maybe("skill gap analysis", supabase.from("skill_gap_analysis").delete().eq("user_id", userId));
  await maybe("roadmap items", supabase.from("roadmap_items").delete().eq("user_id", userId));
  await maybe("roadmaps", supabase.from("roadmaps").delete().eq("user_id", userId));
  await maybe("job matches", supabase.from("job_matches").delete().eq("user_id", userId));
  await maybe("user skills", supabase.from("user_skills").delete().eq("user_id", userId));
  await maybe("resume chunks", supabase.from("resume_chunks").delete().eq("user_id", userId));
  await maybe("resume sections", supabase.from("resume_sections").delete().eq("user_id", userId));
  await maybe("resumes", supabase.from("resumes").delete().eq("user_id", userId));
  await maybe("seed jobs", supabase.from("jobs").delete().eq("source", SEED_SOURCE).eq("raw_data->>seed_email", EMAIL));
  await maybe("job searches", supabase.from("job_searches").delete().eq("user_id", userId));
  await maybe("evaluation tests", supabase.from("evaluation_tests").delete().eq("feature_name", "sample_profile_seed"));
}

async function insertOne(table, row) {
  return expect(
    `insert ${table}`,
    supabase.from(table).insert(row).select("*").single(),
  );
}

async function insertMany(table, rows) {
  return expect(
    `insert ${table}`,
    supabase.from(table).insert(rows).select("*"),
  );
}

const { user, created } = await ensureAuthUser();
const userId = user.id;

await clearPreviousSeedData(userId);

await expect(
  "upsert profile",
  supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: FULL_NAME,
      email: EMAIL,
      avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=Nuren%20Fahmid",
      target_role: "AI Product Engineer",
      location: "Dhaka, Bangladesh",
      bio: "CSE graduate building AI-assisted career tools, resume intelligence workflows, and polished full-stack products with Next.js, FastAPI, Supabase, and LLM integrations.",
    },
    { onConflict: "id" },
  ).select("*").single(),
);

const resume = await insertOne("resumes", {
  user_id: userId,
  file_name: "Nuren_Fahmid_AI_Product_Engineer_Resume.pdf",
  file_type: "application/pdf",
  file_url: "https://example.com/sample-resumes/nuren-fahmid-ai-product-engineer.pdf",
  raw_text: [
    "Nuren Fahmid",
    "AI Product Engineer | Dhaka, Bangladesh | nurenfahmid65@gmail.com",
    "Built CareerPilot, an AI career assistant with resume parsing, job matching, cover letters, reminders, and roadmaps.",
    "Experience includes Next.js, React, TypeScript, FastAPI, Supabase, PostgreSQL, pgvector, and Gemini/OpenAI-style LLM workflows.",
    "Projects: CareerPilot, IUTverse, resume intelligence pipeline, job application tracker, and AI cover letter generator.",
  ].join("\n"),
  parsed_summary: {
    headline: "AI Product Engineer focused on career-tech products",
    years_experience: 2,
    preferred_roles: ["AI Product Engineer", "Full Stack Developer", "Machine Learning Engineer"],
    strengths: ["product thinking", "full-stack implementation", "LLM workflow design", "database-backed UX"],
    education: {
      school: "Islamic University of Technology",
      degree: "BSc in Computer Science and Engineering",
    },
    links: {
      github: "https://github.com/nurenfahmid",
      portfolio: "https://careerpilot.example.com",
      linkedin: "https://www.linkedin.com/in/nurenfahmid",
    },
  },
  status: "processed",
  is_active: true,
});

const sections = await insertMany("resume_sections", [
  {
    resume_id: resume.id,
    user_id: userId,
    section_name: "Summary",
    section_order: 1,
    content: "AI Product Engineer with a strong full-stack foundation, comfortable turning ambiguous product ideas into working tools with thoughtful UX and measurable workflows.",
    metadata: { confidence: 0.97, source: SEED_SOURCE },
  },
  {
    resume_id: resume.id,
    user_id: userId,
    section_name: "Experience",
    section_order: 2,
    content: "Built CareerPilot modules for resumes, job intelligence, kanban applications, AI cover letters, skill-gap roadmaps, reminders, and assistant conversations.",
    metadata: { confidence: 0.95, source: SEED_SOURCE },
  },
  {
    resume_id: resume.id,
    user_id: userId,
    section_name: "Projects",
    section_order: 3,
    content: "CareerPilot: Next.js and FastAPI career platform using Supabase, pgvector retrieval, and AI generation. IUTverse: campus community/productivity platform.",
    metadata: { confidence: 0.96, source: SEED_SOURCE },
  },
  {
    resume_id: resume.id,
    user_id: userId,
    section_name: "Education",
    section_order: 4,
    content: "BSc in Computer Science and Engineering, Islamic University of Technology. Relevant work: databases, software engineering, AI systems, human-computer interaction.",
    metadata: { confidence: 0.93, source: SEED_SOURCE },
  },
  {
    resume_id: resume.id,
    user_id: userId,
    section_name: "Skills",
    section_order: 5,
    content: "TypeScript, React, Next.js, FastAPI, Python, Supabase, PostgreSQL, pgvector, prompt engineering, REST APIs, test automation, Docker.",
    metadata: { confidence: 0.98, source: SEED_SOURCE },
  },
  {
    resume_id: resume.id,
    user_id: userId,
    section_name: "Certifications",
    section_order: 6,
    content: "Completed practical learning paths in full-stack development, database design, cloud deployment, and applied generative AI product workflows.",
    metadata: { confidence: 0.9, source: SEED_SOURCE },
  },
]);

const chunks = await insertMany("resume_chunks", sections.map((section, index) => ({
  resume_id: resume.id,
  user_id: userId,
  section_id: section.id,
  section_name: section.section_name,
  chunk_index: index,
  chunk_text: section.content,
  token_count: Math.ceil(section.content.length / 4),
  metadata: {
    source: SEED_SOURCE,
    section_order: section.section_order,
    quality: "sample",
  },
})));

await insertMany("user_skills", [
  ["TypeScript", "Frontend", "advanced", "Built typed Next.js dashboards, hooks, API routes, and form-heavy workflows."],
  ["React", "Frontend", "advanced", "Implemented responsive workspace pages, kanban boards, drawers, and reusable UI components."],
  ["Next.js", "Frontend", "advanced", "Built app-router pages, protected layouts, API routes, and server-side Supabase flows."],
  ["Python", "Backend", "intermediate", "Implemented FastAPI services, tests, and data-processing scripts."],
  ["FastAPI", "Backend", "intermediate", "Built route/service layers for career assistant and job intelligence APIs."],
  ["Supabase", "Backend", "advanced", "Designed RLS-friendly schemas, auth profiles, service-role clients, and PostgREST integrations."],
  ["PostgreSQL", "Database", "advanced", "Created relational schemas, indexes, constraints, enums, and migration-compatible seed data."],
  ["pgvector", "AI", "intermediate", "Used vector chunks for resume retrieval and RAG context selection."],
  ["Prompt Engineering", "AI", "advanced", "Designed structured prompts for cover letters, roadmaps, reminders, and assistant workflows."],
  ["Product Thinking", "Product", "advanced", "Translated career-management workflows into practical feature modules."],
  ["Testing", "Engineering", "intermediate", "Wrote focused unit and integration tests around hooks, services, parsers, and API routes."],
  ["Docker", "DevOps", "intermediate", "Ran local multi-service development with frontend/backend containers."],
].map(([skill_name, category, proficiency, evidence]) => ({
  user_id: userId,
  resume_id: resume.id,
  skill_name,
  category,
  proficiency,
  evidence,
  source: "resume",
})));

const searches = await insertMany("job_searches", [
  {
    user_id: userId,
    query: "AI Product Engineer",
    location: "Remote, Singapore, Dhaka",
    filters: {
      experience_level: "junior-mid",
      job_type: ["remote", "hybrid"],
      salary_min_usd: 25000,
      keywords: ["LLM", "product", "full-stack"],
    },
    source: SEED_SOURCE,
  },
  {
    user_id: userId,
    query: "Full Stack Developer Supabase Next.js",
    location: "Bangladesh or Remote",
    filters: {
      stack: ["Next.js", "FastAPI", "PostgreSQL"],
      exclude: ["senior-only"],
    },
    source: SEED_SOURCE,
  },
]);

const jobs = await insertMany("jobs", [
  {
    search_id: searches[0].id,
    title: "AI Product Engineer",
    company: "Northstar Labs",
    location: "Remote - APAC",
    salary_range: "$32k-$48k",
    job_type: "Full-time",
    deadline: date("2026-06-28"),
    description: "Build AI-powered product workflows for knowledge workers, from prototype to production.",
    requirements: "TypeScript, React, backend APIs, SQL, LLM product experience, user empathy.",
    source: SEED_SOURCE,
    source_url: "https://example.com/jobs/northstar-ai-product-engineer",
    raw_data: { seed_email: EMAIL, seniority: "junior-mid", remote: true },
  },
  {
    search_id: searches[0].id,
    title: "Machine Learning Product Intern",
    company: "Atlas Career Systems",
    location: "Singapore",
    salary_range: "SGD 1.8k-2.5k/mo",
    job_type: "Internship",
    deadline: date("2026-06-20"),
    description: "Prototype resume intelligence and candidate matching features with product managers and engineers.",
    requirements: "Python, data analysis, embeddings, product sense, clear communication.",
    source: SEED_SOURCE,
    source_url: "https://example.com/jobs/atlas-ml-product-intern",
    raw_data: { seed_email: EMAIL, seniority: "intern", relocation: true },
  },
  {
    search_id: searches[1].id,
    title: "Full Stack Developer",
    company: "BrightPath AI",
    location: "Dhaka, Bangladesh",
    salary_range: "BDT 90k-140k/mo",
    job_type: "Hybrid",
    deadline: date("2026-07-05"),
    description: "Own user-facing product surfaces and API integrations for an AI learning platform.",
    requirements: "Next.js, React, PostgreSQL, API design, testing, deployment experience.",
    source: SEED_SOURCE,
    source_url: "https://example.com/jobs/brightpath-full-stack",
    raw_data: { seed_email: EMAIL, seniority: "mid", hybrid: true },
  },
  {
    search_id: searches[1].id,
    title: "Backend Engineer - Career Data",
    company: "Launchpad Works",
    location: "Remote",
    salary_range: "$28k-$42k",
    job_type: "Contract",
    deadline: date("2026-07-12"),
    description: "Design APIs and data models for career planning, job tracking, and recommendation systems.",
    requirements: "FastAPI, PostgreSQL, Supabase or similar BaaS, queues, observability.",
    source: SEED_SOURCE,
    source_url: "https://example.com/jobs/launchpad-backend-career-data",
    raw_data: { seed_email: EMAIL, seniority: "junior-mid", contract: true },
  },
]);

const jobMatches = await insertMany("job_matches", [
  {
    user_id: userId,
    resume_id: resume.id,
    job_id: jobs[0].id,
    fit_score: 91.5,
    matched_skills: ["TypeScript", "React", "Next.js", "LLM workflows", "PostgreSQL", "Product Thinking"],
    missing_skills: ["A/B testing", "analytics instrumentation"],
    explanation: "Strong fit because the resume shows both product ownership and shipped AI career workflows.",
    evidence_chunks: [chunks[0].id, chunks[1].id, chunks[4].id],
  },
  {
    user_id: userId,
    resume_id: resume.id,
    job_id: jobs[1].id,
    fit_score: 84.0,
    matched_skills: ["Python", "embeddings", "resume intelligence", "product sense"],
    missing_skills: ["formal ML evaluation", "notebook-based experimentation"],
    explanation: "Good fit for applied ML product work; add a compact evaluation portfolio to improve.",
    evidence_chunks: [chunks[2].id, chunks[4].id],
  },
  {
    user_id: userId,
    resume_id: resume.id,
    job_id: jobs[2].id,
    fit_score: 88.25,
    matched_skills: ["Next.js", "React", "PostgreSQL", "testing", "API design"],
    missing_skills: ["production monitoring", "team-scale code reviews"],
    explanation: "The stack overlap is high and CareerPilot demonstrates the exact frontend/backend pattern.",
    evidence_chunks: [chunks[1].id, chunks[2].id, chunks[4].id],
  },
  {
    user_id: userId,
    resume_id: resume.id,
    job_id: jobs[3].id,
    fit_score: 80.75,
    matched_skills: ["FastAPI", "PostgreSQL", "Supabase", "data modeling"],
    missing_skills: ["background jobs", "observability"],
    explanation: "Backend foundations are strong; add queue/monitoring examples before applying.",
    evidence_chunks: [chunks[1].id, chunks[4].id],
  },
]);

const applications = await insertMany("applications", [
  {
    user_id: userId,
    job_id: jobs[0].id,
    job_match_id: jobMatches[0].id,
    status: "interviewing",
    notes: "Recruiter screen completed. Prepare product walkthrough of CareerPilot and one concise system-design story.",
    applied_at: iso("2026-06-01", "14:20:00"),
    deadline: date("2026-06-28"),
  },
  {
    user_id: userId,
    job_id: jobs[1].id,
    job_match_id: jobMatches[1].id,
    status: "applied",
    notes: "Applied with tailored cover letter emphasizing resume intelligence and embeddings work.",
    applied_at: iso("2026-06-03", "10:15:00"),
    deadline: date("2026-06-20"),
  },
  {
    user_id: userId,
    job_id: jobs[2].id,
    job_match_id: jobMatches[2].id,
    status: "saved",
    notes: "High stack match. Customize resume around frontend ownership before applying.",
    deadline: date("2026-07-05"),
  },
  {
    user_id: userId,
    job_id: jobs[3].id,
    job_match_id: jobMatches[3].id,
    status: "rejected",
    notes: "Rejected after initial review; useful feedback was to add backend observability examples.",
    applied_at: iso("2026-05-24", "11:00:00"),
    deadline: date("2026-07-12"),
  },
  {
    user_id: userId,
    status: "offer",
    notes: "Manual sample opportunity used to exercise the kanban offer state.",
    applied_at: iso("2026-05-20", "16:00:00"),
    deadline: date("2026-06-15"),
    manual_job_title: "Frontend Engineer - AI Tools",
    manual_company: "PaperTrail Studio",
    manual_location: "Remote",
  },
]);

await insertMany("application_history", [
  {
    application_id: applications[0].id,
    old_status: null,
    new_status: "saved",
    note: "Saved from AI job match.",
    changed_at: iso("2026-05-30", "20:10:00"),
  },
  {
    application_id: applications[0].id,
    old_status: "saved",
    new_status: "applied",
    note: "Submitted tailored application.",
    changed_at: iso("2026-06-01", "14:20:00"),
  },
  {
    application_id: applications[0].id,
    old_status: "applied",
    new_status: "interviewing",
    note: "Recruiter screen scheduled.",
    changed_at: iso("2026-06-04", "09:30:00"),
  },
  {
    application_id: applications[3].id,
    old_status: "applied",
    new_status: "rejected",
    note: "Archived after rejection email.",
    changed_at: iso("2026-06-02", "18:40:00"),
  },
  {
    application_id: applications[4].id,
    old_status: "interviewing",
    new_status: "offer",
    note: "Received sample offer.",
    changed_at: iso("2026-06-03", "15:25:00"),
  },
]);

const conversation = await insertOne("assistant_conversations", {
  user_id: userId,
  title: "June career sprint planning",
  context: {
    active_resume_id: resume.id,
    target_role: "AI Product Engineer",
    priority_applications: [applications[0].id, applications[2].id],
    source: SEED_SOURCE,
  },
});

await insertMany("assistant_messages", [
  {
    conversation_id: conversation.id,
    user_id: userId,
    role: "user",
    content: "Help me prepare for the Northstar Labs AI Product Engineer interview.",
    used_resume_chunks: [chunks[0].id, chunks[1].id],
    used_job_id: jobs[0].id,
    metadata: { intent: "interview_prep", source: SEED_SOURCE },
  },
  {
    conversation_id: conversation.id,
    user_id: userId,
    role: "assistant",
    content: "Lead with CareerPilot as a product story: the user problem, your data model, the AI workflow, and the measurable improvement you would track next.",
    used_resume_chunks: [chunks[0].id, chunks[1].id, chunks[4].id],
    used_job_id: jobs[0].id,
    metadata: { suggested_focus: ["product narrative", "system design", "metrics"], source: SEED_SOURCE },
  },
  {
    conversation_id: conversation.id,
    user_id: userId,
    role: "user",
    content: "What should I improve this week?",
    used_resume_chunks: [chunks[4].id],
    used_job_id: null,
    metadata: { intent: "weekly_plan", source: SEED_SOURCE },
  },
  {
    conversation_id: conversation.id,
    user_id: userId,
    role: "assistant",
    content: "Add one analytics example, write a concise technical case study, and rehearse a five-minute demo of the resume-to-job-match workflow.",
    used_resume_chunks: [chunks[1].id, chunks[2].id],
    used_job_id: jobs[2].id,
    metadata: { source: SEED_SOURCE },
  },
]);

await insertMany("cover_letters", [
  {
    user_id: userId,
    resume_id: resume.id,
    job_id: jobs[0].id,
    title: "Northstar Labs - AI Product Engineer",
    job_title: "AI Product Engineer",
    company_name: "Northstar Labs",
    job_description: jobs[0].description,
    tone: "confident",
    extra_notes: "Mention CareerPilot as proof of full product ownership.",
    content: "Dear Northstar Labs team,\n\nI am excited by the AI Product Engineer role because it combines product judgment, full-stack execution, and practical LLM workflows. CareerPilot is my strongest example: I designed and built resume parsing, job matching, cover-letter generation, and roadmap planning in one connected product.\n\nI would bring a builder's pace, careful UX thinking, and comfort working across React, APIs, PostgreSQL, and AI integrations.\n\nSincerely,\nNuren Fahmid",
    version: 1,
    metadata: {
      source: SEED_SOURCE,
      used_resume_chunks: [chunks[0].id, chunks[1].id, chunks[4].id],
      fit_score: 91.5,
    },
  },
  {
    user_id: userId,
    resume_id: resume.id,
    job_id: jobs[2].id,
    title: "BrightPath AI - Full Stack Developer",
    job_title: "Full Stack Developer",
    company_name: "BrightPath AI",
    job_description: jobs[2].description,
    tone: "direct",
    extra_notes: "Focus on Next.js and database-backed UX.",
    content: "Dear BrightPath AI team,\n\nYour full-stack role maps closely to the work I have been doing on CareerPilot: designing user workflows, building Next.js interfaces, implementing service APIs, and shaping PostgreSQL/Supabase data models that support real product behavior.\n\nI am especially interested in owning polished learning and AI-assisted experiences from idea to shipped interface.\n\nSincerely,\nNuren Fahmid",
    version: 1,
    metadata: {
      source: SEED_SOURCE,
      used_resume_chunks: [chunks[1].id, chunks[2].id, chunks[4].id],
      fit_score: 88.25,
    },
  },
]);

const roadmap = await insertOne("roadmaps", {
  user_id: userId,
  resume_id: resume.id,
  target_role: "AI Product Engineer",
  duration_weeks: 6,
  overview: "A focused six-week sprint to convert CareerPilot work into interview-ready product stories, close analytics/observability gaps, and apply to high-fit AI product roles.",
  progress_percent: 36.5,
});

const roadmapItems = await insertMany("roadmap_items", [
  {
    roadmap_id: roadmap.id,
    user_id: userId,
    week_number: 1,
    title: "Package CareerPilot as a product case study",
    description: "Write a problem-solution-impact narrative and capture screenshots for the resume intelligence workflow.",
    resources: [
      { label: "Case study outline", url: "https://example.com/resources/product-case-study" },
      { label: "Metrics checklist", url: "https://example.com/resources/product-metrics" },
    ],
    status: "done",
    due_date: date("2026-06-07"),
    completed_at: iso("2026-06-03", "22:00:00"),
  },
  {
    roadmap_id: roadmap.id,
    user_id: userId,
    week_number: 2,
    title: "Add analytics and experiment vocabulary",
    description: "Prepare examples for activation, retention, funnel analysis, A/B tests, and prompt quality evaluation.",
    resources: [
      { label: "Product analytics primer", url: "https://example.com/resources/product-analytics" },
    ],
    status: "in_progress",
    due_date: date("2026-06-14"),
  },
  {
    roadmap_id: roadmap.id,
    user_id: userId,
    week_number: 3,
    title: "Create interview demo script",
    description: "Build a five-minute walkthrough that explains the architecture, user flow, and tradeoffs.",
    resources: [
      { label: "Demo script template", url: "https://example.com/resources/demo-script" },
    ],
    status: "todo",
    due_date: date("2026-06-21"),
  },
  {
    roadmap_id: roadmap.id,
    user_id: userId,
    week_number: 4,
    title: "Strengthen backend operations story",
    description: "Document monitoring, queue, and reliability improvements you would add to CareerPilot.",
    resources: [
      { label: "Backend reliability notes", url: "https://example.com/resources/reliability" },
    ],
    status: "todo",
    due_date: date("2026-06-28"),
  },
]);

const goals = await insertMany("goals", [
  {
    user_id: userId,
    title: "Land an AI Product Engineer interview loop",
    description: "Convert high-fit applications into at least two technical/product interview loops.",
    status: "active",
    target_date: date("2026-07-15"),
  },
  {
    user_id: userId,
    title: "Publish CareerPilot portfolio case study",
    description: "Ship a clear case study with screenshots, architecture, AI workflow decisions, and outcome metrics.",
    status: "active",
    target_date: date("2026-06-18"),
  },
  {
    user_id: userId,
    title: "Finish resume intelligence polish",
    description: "Clean up resume chunk evidence, skill taxonomy, and profile story.",
    status: "completed",
    target_date: date("2026-06-03"),
  },
]);

const tasks = await insertMany("tasks", [
  {
    user_id: userId,
    goal_id: goals[0].id,
    roadmap_item_id: roadmapItems[1].id,
    application_id: applications[0].id,
    title: "Prepare Northstar interview stories",
    description: "Draft STAR answers for product ownership, AI workflow design, and database tradeoffs.",
    status: "in_progress",
    priority: 3,
    due_date: date("2026-06-06"),
  },
  {
    user_id: userId,
    goal_id: goals[1].id,
    roadmap_item_id: roadmapItems[0].id,
    title: "Write CareerPilot case study intro",
    description: "Cover user problem, core workflow, architecture, and what changed after AI features were added.",
    status: "done",
    priority: 2,
    due_date: date("2026-06-05"),
    completed_at: iso("2026-06-03", "21:15:00"),
  },
  {
    user_id: userId,
    goal_id: goals[0].id,
    application_id: applications[2].id,
    title: "Tailor resume for BrightPath AI",
    description: "Move Next.js, testing, and PostgreSQL work higher in the resume.",
    status: "todo",
    priority: 2,
    due_date: date("2026-06-09"),
  },
  {
    user_id: userId,
    goal_id: goals[1].id,
    roadmap_item_id: roadmapItems[2].id,
    title: "Record five-minute product demo",
    description: "Show resume upload, extracted skills, job match, generated cover letter, and roadmap output.",
    status: "todo",
    priority: 1,
    due_date: date("2026-06-16"),
  },
  {
    user_id: userId,
    goal_id: goals[2].id,
    title: "Normalize skill names in profile",
    description: "Group skills by frontend, backend, database, AI, and product categories.",
    status: "done",
    priority: 1,
    due_date: date("2026-06-03"),
    completed_at: iso("2026-06-03", "18:00:00"),
  },
]);

await insertMany("calendar_events", [
  {
    user_id: userId,
    task_id: tasks[0].id,
    application_id: applications[0].id,
    title: "Northstar Labs recruiter screen",
    description: "Review role notes and prepare two questions about product metrics.",
    event_type: "interview",
    start_time: iso("2026-06-08", "20:00:00"),
    end_time: iso("2026-06-08", "20:45:00"),
    reminder_time: iso("2026-06-08", "18:00:00"),
  },
  {
    user_id: userId,
    task_id: tasks[2].id,
    application_id: applications[2].id,
    title: "BrightPath resume tailoring deadline",
    description: "Submit the tailored resume and application package.",
    event_type: "deadline",
    start_time: iso("2026-06-09", "22:00:00"),
    end_time: iso("2026-06-09", "22:30:00"),
    reminder_time: iso("2026-06-09", "10:00:00"),
  },
  {
    user_id: userId,
    task_id: tasks[3].id,
    title: "Record CareerPilot demo",
    description: "Screen-record the core workflow and save a short voiceover script.",
    event_type: "study",
    start_time: iso("2026-06-15", "19:30:00"),
    end_time: iso("2026-06-15", "21:00:00"),
    reminder_time: iso("2026-06-15", "17:30:00"),
  },
  {
    user_id: userId,
    application_id: applications[1].id,
    title: "Atlas ML Product follow-up",
    description: "Send a polite follow-up with one sentence about embedding evaluation.",
    event_type: "reminder",
    start_time: iso("2026-06-11", "11:00:00"),
    end_time: iso("2026-06-11", "11:15:00"),
    reminder_time: iso("2026-06-10", "20:00:00"),
  },
]);

await insertOne("skill_gap_analysis", {
  user_id: userId,
  resume_id: resume.id,
  job_id: jobs[0].id,
  target_role: "AI Product Engineer",
  current_skills: ["TypeScript", "React", "Next.js", "FastAPI", "Supabase", "PostgreSQL", "LLM workflows", "Product Thinking"],
  required_skills: ["TypeScript", "React", "SQL", "LLM product design", "analytics instrumentation", "A/B testing", "system design"],
  missing_skills: ["analytics instrumentation", "A/B testing", "production observability"],
  recommendations: {
    source: SEED_SOURCE,
    summary: "Nuren is close to role-ready; the main gaps are measurement vocabulary and operational maturity examples.",
    actions: [
      "Add analytics events and a metrics dashboard to CareerPilot.",
      "Write one A/B testing thought exercise for cover letter generation.",
      "Document monitoring and retry strategy for AI API calls.",
    ],
    priority_order: ["analytics instrumentation", "A/B testing", "production observability"],
  },
});

await insertMany("evaluation_tests", [
  {
    feature_name: "sample_profile_seed",
    input_data: {
      email: EMAIL,
      scenario: "complete_profile_dashboard",
      expected_tables: [
        "profiles",
        "resumes",
        "resume_sections",
        "resume_chunks",
        "user_skills",
        "job_searches",
        "jobs",
        "job_matches",
        "applications",
        "application_history",
        "assistant_conversations",
        "assistant_messages",
        "cover_letters",
        "roadmaps",
        "roadmap_items",
        "goals",
        "tasks",
        "calendar_events",
        "skill_gap_analysis",
      ],
    },
    expected_output: "Dashboard, resume, tracker, jobs, assistant, cover letters, roadmap, goals, and calendar all have sample data.",
    actual_output: "Seed completed successfully.",
    passed: true,
    notes: "Inserted by frontend/scripts/seed-sample-profile.mjs.",
  },
]);

const counts = {};
for (const table of [
  "profiles",
  "resumes",
  "resume_sections",
  "resume_chunks",
  "user_skills",
  "job_searches",
  "jobs",
  "job_matches",
  "applications",
  "application_history",
  "assistant_conversations",
  "assistant_messages",
  "cover_letters",
  "roadmaps",
  "roadmap_items",
  "goals",
  "tasks",
  "calendar_events",
  "skill_gap_analysis",
  "evaluation_tests",
]) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (table === "profiles") query = query.eq("id", userId);
  else if (table === "jobs") query = query.eq("source", SEED_SOURCE).eq("raw_data->>seed_email", EMAIL);
  else if (table === "evaluation_tests") query = query.eq("feature_name", "sample_profile_seed");
  else if (table !== "application_history") query = query.eq("user_id", userId);

  if (table === "application_history") {
    query = query.in("application_id", applications.map((application) => application.id));
  }

  const { count, error } = await query;
  counts[table] = error ? `error: ${error.message}` : count;
}

console.log(JSON.stringify({
  email: EMAIL,
  user_id: userId,
  auth_user_created: created,
  counts,
}, null, 2));
