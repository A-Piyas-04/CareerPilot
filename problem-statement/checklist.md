# CareerPilot — Hackathon Checklist

> Derived from [`Problem-statement.md`](./Problem-statement.md)  
> Codebase audit: **May 30, 2026** (monorepo: Next.js 16 + FastAPI + Supabase + Gemini + JSearch)

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Implemented and working in codebase |
| ⚠️ | Partially done, prototype, or needs refinement / upgrade |
| ❌ | Not implemented or missing vs. problem statement |

---

## Overall — Core Idea & Platform

| Item | Requirement / Constraint | Status | Notes |
|------|------------------------|--------|-------|
| Core idea | RAG over user's CV is single source of truth for all agents | ✅ | `resume_chunks` + pgvector; shared `rag_context_service` + `/api/v1/rag/context` |
| Core idea | No agent hallucinates user background | ⚠️ | Guardrails in assistant + CV answer prompts; quality depends on retrieval + user having uploaded CV |
| Platform | End-to-end agentic career co-pilot in one platform | ⚠️ | Four pillars largely present; Pillar 4 dashboard live, nudges partial |
| Platform | Working web or mobile app | ✅ | Next.js web app; Docker Compose runnable |
| Platform | All four pillars implemented or prototyped | ⚠️ | Pillars 1–3 strong; Pillar 4 dashboard ✅; AI nudges on dashboard ⚠️ |

---

## Pillar 1 — Job Hunter Agent

| Item | Requirement / Constraint | Status | Notes |
|------|------------------------|--------|-------|
| Input | Natural-language job search (e.g. “ML internships in Dhaka”) | ✅ | `/jobs` search form → `POST /api/v1/jobs/search` |
| Output | Structured job cards | ⚠️ | Cards show role, company, location, fit score, skills, explanation; **salary & deadline not shown on UI** (backend has `salary_range`; JSearch rarely fills deadline) |
| Output | Role, company, salary range on card | ⚠️ | `salary_range` stored from JSearch; **not rendered** in `match-card.tsx` |
| Output | Application deadline on card | ❌ | `jobs.deadline` exists in schema; JSearch adapter does not map deadline |
| Output | Location on card | ✅ | Shown on match cards |
| Output | Fit score on card | ✅ | Programmatic badge (0–100) |
| Reasoning | Agent explains WHY each result matches (or doesn't), grounded in CV | ⚠️ | `explanation` + matched/missing skills from `job_scorer.py`; not a conversational agent narrative |
| Config | JSearch credentials via environment | ✅ | `JSEARCH_API_KEY`, `JSEARCH_API_HOST`, `JSEARCH_BASE_URL` in `backend/.env`; legacy `RAPIDAPI_*` aliases in `config.py` |
| Live search | At least one live search (job board API / scraping) | ✅ | JSearch via RapidAPI (`JSearchAdapter`); **verified E2E** on `/jobs` with subscribed RapidAPI key |
| External tools | Agent uses external tool calls (search API) | ✅ | `httpx` → `{JSEARCH_BASE_URL}/search`; satisfies core technical requirement |
| Error handling | Actionable JSearch / RapidAPI failures | ✅ | `JSearchError` maps 403 (not subscribed), 401/403 (bad key), 429 (quota) to clear API responses |
| Fit score | Computed programmatically (not LLM-only) | ✅ | `0.6 × skills_overlap + 0.4 × chunk_similarity` in `job_scorer.py` |
| Persistence | Search results stored | ✅ | `job_searches`, `jobs`, `job_matches` |
| Tracker link | Save match → application tracker | ✅ | `POST /matches/{id}/save` → Kanban `saved` |
| Manual JD | Paste job description for scoring | ⚠️ | `POST /api/v1/jobs/manual` + `addManualJob()`; **no UI form on `/jobs`** |

---

## Pillar 2 — Profile & Resume Intelligence (RAG Core)

| Item | Requirement / Constraint | Status | Notes |
|------|------------------------|--------|-------|
| Upload | PDF/DOCX CV upload | ✅ | `POST /api/v1/resumes/upload`; max 10 MB; pypdf + python-docx |
| In-app builder | Build CV directly inside platform | ✅ | `POST /api/v1/resumes/build`, `PUT .../build`; frontend builder + edit |
| Manual CV entry | Structured form → chunk → embed | ✅ | `POST /api/v1/resumes/manual`, `PUT .../manual`; `file_type: manual` |
| Chunking | CV chunked by section (experience, education, skills, projects) | ✅ | `section_detector.py` + `chunker.py` (900 char / 150 overlap) |
| Embedding | Chunks embedded and stored in vector DB | ✅ | Gemini embeddings → `resume_chunks` (pgvector) |
| Downstream RAG | Job matching, cover letters, gap analysis use this store | ✅ | Scorer, assistant, `career_generation_service` use RAG context |
| Semantic search | Query chunks by similarity | ✅ | `POST /api/v1/resumes/query` + RPC `match_resume_chunks` |
| Semantic search UI | Raw chunk search on `/resume` | ✅ | `ResumeQueryBox` — advanced collapsible panel with similarity scores |
| Grounded Q&A | Answer questions from CV with evidence | ✅ | `POST /api/v1/resumes/answer` + evidence UI on `/resume` |
| CV upload preview UI | Post-upload summary in drawer | ✅ | `resume-upload-preview-drawer.tsx` — sections/skills/chunk counts |
| CV section viewer UI | Full-screen section content | ✅ | `resume-section-viewer-drawer.tsx` |
| CV delete confirm UI | Professional delete dialog | ✅ | `resume-delete-dialog.tsx` |
| Skills extraction | Skills indexed from CV | ✅ | Gemini + regex fallback → `user_skills` |
| Vector ops risk | Embedding dimension alignment (384 vs 768) | ⚠️ | App defaults 768 (Gemini); migrations/RPC may be 384 — Alembic `embedding_new` path; must align in deployment |
| File storage | Raw CV in object storage | ❌ | `file_url` column unused; text-only pipeline |
| Scanned PDFs | OCR for image-only PDFs | ❌ | Empty text → 422 (documented out of scope) |

---

## Pillar 3 — Personal AI Assistant

| Item | Requirement / Constraint | Status | Notes |
|------|------------------------|--------|-------|
| Interface | Conversational UI with user context | ✅ | `/chat` — `ChatWorkspace`, streaming SSE |
| Context | Knows user before they speak (profile + CV) | ✅ | Profile + `getResumeContext()` → live `POST /api/v1/rag/context` |
| Memory | Conversational memory within a session | ✅ | `loadConversationMemory` — last 12 messages per conversation |
| Persistence | Conversations & messages saved | ✅ | `assistant_conversations`, `assistant_messages` |
| Query | “Am I ready for this data engineer role?” → verdict + reasoning | ✅ | `readiness_check` intent + grounded prompts |
| Query | “What skills am I missing for a Google internship?” → skill gap | ⚠️ | Chat intent + `POST /api/v1/career/skill-gap/analyze`; **no dedicated UI page** |
| Query | “Build me a 3-month roadmap…” → weekly plan + resources | ✅ | `/roadmap` generate + detail timeline; chat **Save Roadmap**; items → task/calendar APIs |
| Query | “Draft a cover letter…” → personalized from real experience | ✅ | `/cover-letters` studio (generate, edit, regenerate) + chat save path |
| Cover letter metadata | Job title, company, tone, JD stored on letter | ✅ | `cover_letters` columns + Pydantic models; migration `20260529000000` |
| Roadmap ↔ resume | Roadmap linked to active CV | ✅ | `roadmaps.resume_id` FK; generate form can pass resume |
| RAG grounding | Responses grounded in actual CV chunks | ✅ | RAG context in system prompt; `ChunkEvidenceCard` in chat when chunks used |
| Hallucination guard | No CV → explicit warning, no invented background | ✅ | Banners + system prompt guards in `route.ts` |
| LLM | Uses external LLM (Gemini) | ✅ | `createGeminiStream` in Next.js route handler |
| Intent routing | Benchmark query types detected | ✅ | Rules + Gemini classifier in `detectIntent.ts` |

---

## Pillar 4 — Productivity & Progress Tracker

| Item | Requirement / Constraint | Status | Notes |
|------|------------------------|--------|-------|
| Calendar | Calendar view with events | ✅ | `/calendar` — `react-big-calendar` |
| Calendar | Deadline reminders on events | ⚠️ | `reminder_time` field + event types; **no push/email/scheduled nudge delivery** |
| Calendar | Application deadlines surfaced | ✅ | Synthetic `application_deadline` events from tracker |
| To-Do | To-do items per day/week | ✅ | Standalone `TaskList` buckets (overdue/today/week/later) |
| To-Do | Tasks linked to career goals | ✅ | Goal-nested tasks via FastAPI; `goal_id` on `tasks` |
| Goals | Goal setting (apply to N jobs, finish course, etc.) | ✅ | `/goals` — CRUD, status, target dates |
| Goals | Per-goal progress % | ⚠️ | Task completion % on goal cards only; not platform-wide |
| Application tracker | Kanban: Applied / Interviewing / Offer / Rejected | ✅ | `/tracker` + DnD; includes `saved` column |
| Application tracker | Full application history | ✅ | `application_history` + timeline in detail drawer |
| Dashboard | Progress dashboard (weekly stats) | ✅ | `/dashboard` — `DashboardPageClient` + `GET /api/dashboard/metrics` |
| Dashboard | Applications sent, skills added, roadmap % complete | ⚠️ | Jobs applied, active apps, roadmap %, tasks/week, pipeline chart ✅; **skills-added count not on dashboard** |
| Dashboard | Streak counter | ✅ | `calculateWeeklyStreak` — weeks with ≥1 completed task |
| AI nudges | Proactive agent reminders (e.g. “3 openings matching profile”) | ⚠️ | `AiNudges` on `/dashboard` via `POST /api/reminders/generate`; **not on-login / push; job-match nudges not explicit** |
| Calendar ↔ goals | Deadlines linked to goals | ⚠️ | Tasks/events can link `goal_id`, `application_id`; not fully automated from goals |
| Roadmap → task | Create task from roadmap item | ✅ | `POST /api/roadmap/items/[itemId]/create-task` (Next.js BFF) |
| Roadmap → calendar | Add study event from roadmap item | ✅ | `POST /api/roadmap/items/[itemId]/add-to-calendar` + `AddToCalendarModal` |

---

## Section 3 — Required Features (Scoring)

### Core Technical Requirements

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | RAG architecture grounded in user's actual CV | ✅ | Full pipeline + shared RAG API |
| 2 | At least one agent uses external tool calls | ✅ | JSearch (RapidAPI) for job search |
| 3 | AI assistant demonstrates conversational memory within session | ✅ | Last 12 messages injected |
| 4 | Fit scores computed programmatically | ✅ | `job_scorer.py` formula |
| 5 | Tracker module includes working calendar and to-do | ✅ | `/calendar` + tasks on `/goals` |

### Feature Checklist (all required for score)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Working app with all four pillars implemented or prototyped | ⚠️ | Pillar 4 dashboard ✅; AI nudges partial |
| 2 | CV upload pipeline: PDF/DOCX → chunk → embed → vector DB | ✅ | End-to-end in `resume_service.process_resume()` |
| 3 | Job Hunter with live search + structured cards | ⚠️ | Live JSearch search **verified E2E** ✅; cards missing salary/deadline display |
| 4 | Fit score: % match + explanation for a posting | ✅ | Score + `explanation` + skills on match cards |
| 5 | AI Assistant chat with RAG across benchmark query types | ⚠️ | Chat intents ✅; roadmap + cover letter have dedicated pages; **skill gap page still missing** |
| 6 | Calendar + to-do with deadline tracking linked to goals | ✅ | Calendar + goal tasks + standalone tasks |
| 7 | Kanban application tracker (4+ statuses) | ✅ | saved → applied → interviewing → offer → rejected |
| 8 | Progress dashboard with real data | ⚠️ | `/dashboard` with real Supabase metrics; skills-added widget still missing |

---

## Deliverables

| Item | Requirement | Status | Notes |
|------|-------------|--------|-------|
| **4.1 Application** | Working demo covering all four pillars | ⚠️ | Runnable via `docker compose up`; pillar gaps above |
| **4.1 Application** | Runnable from source by judges | ✅ | `docker-compose.yml`, README setup steps |
| **4.2 Repository** | Public GitHub with source before deadline | ⚠️ | Repo exists locally; **verify public remote & final commit before submit** |
| **4.2 Repository** | README: setup, env vars, how to run | ⚠️ | `README.md` present but **outdated** (Anthropic, hashing embeddings, “routes pending”) vs actual Gemini/JSearch stack |
| **4.2 Repository** | Architecture diagram: CV upload → agent response | ⚠️ | Text architecture in README + `Docs/cv-intelligence-implementation.md`; **no single diagram in README** as required |
| **4.3 Demo** | 5-minute recorded video | ❌ | No video file in repo (organizer deliverable) |
| **4.3 Demo** | Full flow: CV → search → fit → assistant → cover letter → tracker | ✅ | Full path supported including live JSearch on `/jobs`; cover letter via `/cover-letters` or chat; roadmap via `/roadmap` |

---

## Bonus Points

| Bonus | What judges check | Status | Notes |
|-------|-------------------|--------|-------|
| Live deployment | Public URL; stable during judging | ❌ | No deployment URL documented in repo |
| System design doc | Data flow, scale to 10k users, cost/user, bottlenecks | ⚠️ | `Docs/db-design.md` (1625 lines) + `present-state.md` — strong schema/flow docs; **missing explicit cost/scaling analysis** per bonus rubric |
| Evaluation suite | ≥5 documented test cases (input, expected, actual, pass/fail) | ❌ | `evaluation_tests` table + Pydantic models only; **no populated cases or verdict doc** |
| Automated tests | (Supporting) | ⚠️ | pytest: CV + job intelligence + career generation + **career-assistant service/model** tests; Vitest on cover-letter/roadmap/chat API routes |

---

## Rules & Constraints

### Permitted (must comply)

| Rule | Status | Notes |
|------|--------|-------|
| Open-source libraries & UI components | ✅ | Next.js, FastAPI, Supabase, etc. |
| Public APIs & third-party LLMs | ✅ | Gemini, JSearch/RapidAPI (`JSEARCH_API_KEY` / `JSEARCH_BASE_URL`), Supabase |
| Boilerplate starters allowed; core built during hackathon | ⚠️ | Next.js starter assumed; **team attestation required** |

### Not permitted (must avoid)

| Rule | Status | Notes |
|------|--------|-------|
| Pre-hackathon project / purchased software | ⚠️ | Cannot verify from code — team responsibility |
| Hardcoded AI responses or faked live agents | ✅ | Real Gemini + live JSearch (RapidAPI) integrations |
| Sharing solutions with other teams | ⚠️ | Process rule — team responsibility |

---

## Quick Score Summary

| Area | Done ✅ | Partial ⚠️ | Missing ❌ |
|------|---------|------------|------------|
| Pillar 1 — Job Hunter | 9 | 4 | 1 |
| Pillar 2 — RAG / CV | 8 | 1 | 2 |
| Pillar 3 — AI Assistant | 10 | 2 | 0 |
| Pillar 4 — Productivity | 10 | 4 | 1 |
| Required features (§3) | 4 | 5 | 0 |
| Deliverables | 1 | 4 | 1 |
| Bonus | 0 | 2 | 2 |

---

## Recommended Next Actions (priority)

1. ⚠️ **Dashboard polish** — add skills-added metric; surface job-match nudges (Pillar 4).
2. ⚠️ **AI nudges** — expand beyond dashboard card (on-login, job-match prompts).
3. ⚠️ **Job cards** — display `salary_range`; map/show deadline when API provides it.
4. ⚠️ **README + architecture diagram** — update stack/env vars; add one diagram for judges (deliverable 4.2).
5. ❌ **Evaluation suite bonus** — seed 5+ rows in `evaluation_tests` or markdown doc with pass/fail.
6. ❌ **5-minute demo video** — record full required flow (deliverable 4.3).
7. ❌ **Live deployment** — Vercel + Railway/Render with env vars (bonus).
8. ⚠️ **pgvector dimension** — align RPC/column with 768-dim Gemini before judging.
9. ⚠️ **Manual job paste UI** on `/jobs` for fit score without JSearch.
10. ❌ **Skill gap dedicated page** — chat/API only; roadmaps + cover letters now have full UI.
11. ⚠️ **Landing page** — list Job Hunter + Roadmap alongside Cover Letter Studio on `/`.

---

*Re-audit after major changes by re-running through the app and updating emoji status in this file.*
