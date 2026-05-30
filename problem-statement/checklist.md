# CareerPilot — Hackathon Checklist

> Derived from [`Problem-statement.md`](./Problem-statement.md)  
> Codebase audit: **May 30, 2026** (monorepo: Next.js 16 + FastAPI + Supabase + Gemini + JSearch)  
> Last cross-module / UI polish pass: authenticated app UI polish (May 30, 2026) — premium workspace theme across dashboard, resume, jobs, chat, skill-gap, cover-letters, roadmap, tracker, goals, calendar, login, error/404

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
| Platform | End-to-end agentic career co-pilot in one platform | ✅ | Four pillars wired with cross-module flows (jobs → cover letter / gap / roadmap / chat → tracker → dashboard) |
| Platform | Working web or mobile app | ✅ | Next.js web app; Docker Compose runnable |
| Platform | All four pillars implemented or prototyped | ✅ | Pillars 1–4 live; dashboard + job-match nudges on `/dashboard` |
| Cross-module UX | Job Hunter actions deep-link to other pillars with prefill | ✅ | `job-actions.ts` → cover letters, skill gap, roadmap, chat, tracker; URL/query prefill on target pages |
| Shared navigation | Consistent app shell across authenticated routes | ✅ | Grouped `AppNav` (Discover / Plan / Track), context sub-nav, mobile drawer; sign-out centralized |

---

## Pillar 1 — Job Hunter Agent

| Item | Requirement / Constraint | Status | Notes |
|------|------------------------|--------|-------|
| Input | Natural-language job search (e.g. “ML internships in Dhaka”) | ✅ | `/jobs` search form → `POST /api/v1/jobs/search` |
| Output | Structured job cards | ✅ | Cards show role, company, location, salary, fit score, matched/gap skills, expandable why + CV evidence |
| Output | Role, company, salary range on card | ✅ | `salary_range` rendered in `match-card.tsx` metadata row |
| Output | Application deadline on card | ⚠️ | Shown when present on `jobs.deadline`; JSearch rarely provides deadline |
| Output | Location on card | ✅ | Shown on match cards |
| Output | Fit score on card | ✅ | Programmatic badge (0–100) |
| Reasoning | Agent explains WHY each result matches (or doesn't), grounded in CV | ✅ | Expandable explanation + skills/similarity bars + CV evidence snippets on match cards |
| Config | JSearch credentials via environment | ✅ | `JSEARCH_API_KEY`, `JSEARCH_API_HOST`, `JSEARCH_BASE_URL` in `backend/.env`; legacy `RAPIDAPI_*` aliases in `config.py` |
| Live search | At least one live search (job board API / scraping) | ✅ | JSearch via RapidAPI (`JSearchAdapter`); **verified E2E** on `/jobs` with subscribed RapidAPI key |
| External tools | Agent uses external tool calls (search API) | ✅ | `httpx` → `{JSEARCH_BASE_URL}/search`; satisfies core technical requirement |
| Error handling | Actionable JSearch / RapidAPI failures | ✅ | `JSearchError` maps 403 (not subscribed), 401/403 (bad key), 429 (quota) to clear API responses |
| Fit score | Computed programmatically (not LLM-only) | ✅ | `0.6 × skills_overlap + 0.4 × chunk_similarity` in `job_scorer.py` |
| Persistence | Search results stored | ✅ | `job_searches`, `jobs`, `job_matches` |
| Tracker link | Save match → application tracker | ✅ | Denormalized title/company/location/deadline on save; idempotent; tracker joins `jobs` + `job_matches` fit data |
| Manual JD | Paste job description for scoring | ✅ | `ManualJobDrawer` on `/jobs` → `POST /api/v1/jobs/manual` |
| Cross-pillar actions | Open cover letter / skill gap / roadmap / assistant from a match | ✅ | `MatchJobActions` on card + detail drawer with `jobId` prefill |

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
| Interface | Conversational UI with user context | ✅ | `/chat` — `ChatWorkspace`, streaming SSE, `AppNav` |
| Context | Knows user before they speak (profile + CV) | ✅ | Profile + `getResumeContext()` → live `POST /api/v1/rag/context` |
| Job context in chat | Optional grounding from Job Hunter selection | ✅ | `?jobId=` → `getJobContext` + benchmark prompts + `used_job_id` in API |
| Memory | Conversational memory within a session | ✅ | `loadConversationMemory` — last 12 messages per conversation |
| Persistence | Conversations & messages saved | ✅ | `assistant_conversations`, `assistant_messages` |
| Query | “Am I ready for this data engineer role?” → verdict + reasoning | ✅ | `readiness_check` intent + grounded prompts; job-context prompts when `jobId` set |
| Query | “What skills am I missing for a Google internship?” → skill gap | ✅ | Chat intent + `POST /api/v1/career/skill-gap/analyze` + dedicated `/skill-gap` page with Job Hunter prefill + history |
| Query | “Build me a 3-month roadmap…” → weekly plan + resources | ✅ | `/roadmap` generate + detail timeline; chat **Save Roadmap**; items → task/calendar APIs; URL prefill from jobs |
| Query | “Draft a cover letter…” → personalized from real experience | ✅ | `/cover-letters` studio (generate, edit, regenerate) + chat save path; `?jobId=` prefill |
| Skill gap page | Dedicated analysis UI + saved history | ✅ | `/skill-gap` — analyze form, list, detail; `GET /career/skill-gap` list/detail APIs |
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
| Calendar | Calendar view with events | ✅ | `/calendar` — `react-big-calendar` + `AppNav` |
| Calendar | Deadline reminders on events | ⚠️ | `reminder_time` field + event types; **no push/email/scheduled nudge delivery** |
| Calendar | Application deadlines surfaced | ✅ | Synthetic `application_deadline` events from tracker |
| To-Do | To-do items per day/week | ✅ | Standalone `TaskList` buckets (overdue/today/week/later) |
| To-Do | Tasks linked to career goals | ✅ | Goal-nested tasks via FastAPI; `goal_id` on `tasks` |
| Goals | Goal setting (apply to N jobs, finish course, etc.) | ✅ | `/goals` — CRUD, status, target dates |
| Goals | Per-goal progress % | ⚠️ | Task completion % on goal cards only; not platform-wide |
| Application tracker | Kanban: Applied / Interviewing / Offer / Rejected | ✅ | `/tracker` + DnD; includes `saved` column |
| Application tracker | Full application history | ✅ | `application_history` + timeline in detail drawer |
| Application tracker | Fit score / gaps when linked to Job Hunter | ✅ | `job_matches` join on application detail; links back to jobs / cover letter / chat |
| Dashboard | Progress dashboard (weekly stats) | ✅ | `/dashboard` — `DashboardPageClient` + `GET /api/dashboard/metrics` |
| Dashboard | Applications sent, skills added, roadmap % complete | ✅ | Jobs applied, active apps, **skillsAdded** from `user_skills`, roadmap %, tasks/week, pipeline chart |
| Dashboard | Streak counter | ✅ | `calculateWeeklyStreak` — weeks with ≥1 completed task |
| AI nudges | Proactive agent reminders (e.g. “3 openings matching profile”) | ✅ | Dashboard nudges include high-fit unsaved job matches + deterministic `/jobs` prompt |
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
| 1 | Working app with all four pillars implemented or prototyped | ✅ | All pillars + cross-module demo path documented |
| 2 | CV upload pipeline: PDF/DOCX → chunk → embed → vector DB | ✅ | End-to-end in `resume_service.process_resume()` |
| 3 | Job Hunter with live search + structured cards | ✅ | Live JSearch + filters/sort + parallel scoring + match actions |
| 4 | Fit score: % match + explanation for a posting | ✅ | Score + `explanation` + skills + evidence on match cards |
| 5 | AI Assistant chat with RAG across benchmark query types | ✅ | Chat intents + job context from Job Hunter; benchmark prompts when job selected |
| 6 | Calendar + to-do with deadline tracking linked to goals | ✅ | Calendar + goal tasks + standalone tasks |
| 7 | Kanban application tracker (4+ statuses) | ✅ | saved → applied → interviewing → offer → rejected |
| 8 | Progress dashboard with real data | ✅ | `/dashboard` with skillsAdded, pipeline, job-match nudges |

---

## Deliverables

| Item | Requirement | Status | Notes |
|------|-------------|--------|-------|
| **4.1 Application** | Working demo covering all four pillars | ✅ | Runnable via `docker compose up`; end-to-end flow in README + `Docs/evaluation-suite.md` |
| **4.1 Application** | Runnable from source by judges | ✅ | `docker-compose.yml`, README setup steps |
| **4.2 Repository** | Public GitHub with source before deadline | ⚠️ | Repo exists locally; **verify public remote & final commit before submit** |
| **4.2 Repository** | README: setup, env vars, how to run | ✅ | Updated for Gemini, JSearch, Docker, architecture diagram, demo script |
| **4.2 Repository** | Architecture diagram: CV upload → agent response | ✅ | Mermaid diagram in README + module docs |
| **4.3 Demo** | 5-minute recorded video | ❌ | No video file in repo (organizer deliverable) |
| **4.3 Demo** | Full flow: CV → search → fit → assistant → cover letter → tracker | ✅ | Full path supported including live JSearch on `/jobs`; cover letter via `/cover-letters` or chat; roadmap via `/roadmap`; skill gap via `/skill-gap` |

---

## Bonus Points

| Bonus | What judges check | Status | Notes |
|-------|-------------------|--------|-------|
| Live deployment | Public URL; stable during judging | ❌ | No deployment URL documented in repo |
| System design doc | Data flow, scale to 10k users, cost/user, bottlenecks | ⚠️ | `Docs/db-design.md` + `present-state.md` — strong schema/flow docs; **missing explicit cost/scaling analysis** per bonus rubric |
| Evaluation suite | ≥5 documented test cases (input, expected, actual, pass/fail) | ✅ | [`Docs/evaluation-suite.md`](../Docs/evaluation-suite.md) — 10 cases + demo script |
| Automated tests | (Supporting) | ⚠️ | pytest: CV + job intelligence + career generation + career-assistant tests; Vitest on cover-letter/roadmap/chat API routes |

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

## New / supporting work (from Part 2 + UI polish)

| Area | Status | Key paths |
|------|--------|-----------|
| Job Hunter deep links | ✅ | `frontend/src/features/jobs/job-actions.ts`, `match-job-actions.tsx` |
| Skill gap list/detail API | ✅ | `GET /api/v1/career/skill-gap`, `GET .../{id}` |
| Skill gap frontend | ✅ | `frontend/src/app/skill-gap/`, `features/skill-gap/` |
| Tracker fit enrichment | ✅ | `applications.py` join on `jobs` + `job_matches`; drawer UI |
| Dashboard job nudges | ✅ | `reminders/generate` + `highFitUnsavedMatches` |
| Shared UI shell | ✅ | `components/layout/page-shell.tsx`, `detail-page-shell.tsx`, `lib/ui-theme.ts` (premium tokens, badges, accents) |
| Grouped navigation | ✅ | `components/nav/AppNav.tsx`, `NavGroupMenu.tsx`, `NavContextBar.tsx`, `MobileNavDrawer.tsx`, `lib/navigation-config.ts`, `lib/nav-styles.ts` |
| Evaluation doc | ✅ | `Docs/evaluation-suite.md` |

---

## Quick Score Summary

| Area | Done ✅ | Partial ⚠️ | Missing ❌ |
|------|---------|------------|------------|
| Pillar 1 — Job Hunter | 11 | 1 | 0 |
| Pillar 2 — RAG / CV | 13 | 1 | 2 |
| Pillar 3 — AI Assistant | 15 | 0 | 0 |
| Pillar 4 — Productivity | 12 | 3 | 0 |
| Required features (§3) | 8 | 0 | 0 |
| Deliverables | 5 | 1 | 1 |
| Bonus | 1 | 2 | 1 |

---

## Recommended Next Actions (priority)

1. ❌ **5-minute demo video** — record full required flow (deliverable 4.3).
2. ❌ **Live deployment** — Vercel + Railway/Render with env vars (bonus).
3. ⚠️ **pgvector dimension** — align RPC/column with 768-dim Gemini before judging.
4. ⚠️ **Public GitHub** — confirm remote is public and tagged for submission.
5. ⚠️ **Global AI nudges** — optional on-login banner beyond `/dashboard` card.
6. ⚠️ **Push/email reminders** — calendar `reminder_time` has no delivery channel.
7. ⚠️ **System design bonus** — add cost/scaling section to docs.
8. ✅ **Search history UI** — `/jobs` search history panel with `GET /api/v1/jobs/searches`.
9. ❌ **Raw CV object storage** — optional; `file_url` unused.
10. ⚠️ **Landing copy** — refresh hero text (still mentions assistant “coming online” in places).

---

*Re-audit after major changes by re-running through the app and updating emoji status in this file.*

---

## Implementation Notes (2026-05-30)

**Implemented:** `GET /api/v1/jobs/searches` backend endpoint; frontend search history browser on `/jobs`; shared confirm modal; chat rename, intent badges, guided workflows; branded error/404 pages.

**Backend API added:** `GET /api/v1/jobs/searches` — returns user job searches with `match_count`.

**Limitations:** Re-run prefills only; no auto-search. History rows do not store which resume was used for the original search.
