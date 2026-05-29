# CareerPilot — Present State

> Last updated: May 29, 2026

---

## Overview

**CareerPilot** is a full-stack career co-pilot for managing job search, CV intelligence, goals, calendar, and AI-assisted planning. The repo is a monorepo:

| Layer | Stack |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4 |
| **Backend** | FastAPI + Uvicorn, Python 3.11 |
| **Database / Auth** | Supabase (PostgreSQL 15 + Auth + RLS) |
| **Containers** | Docker Compose (backend `:8000`, frontend `:3000`) |

### End-to-end features (live today)

| # | Feature | Route(s) | Backend | Frontend data path |
|---|---|---|---|---|
| 1 | **Authentication** | `/login` | JWT validation via `get_current_user` | Supabase cookie sessions (`@supabase/ssr`) |
| 2 | **Landing / marketing** | `/` | — | Static Next.js page |
| 3 | **Kanban job tracker** | `/tracker` | FastAPI `/api/v1/applications` | React Query → `apiRequest` |
| 4 | **CV Intelligence** | `/resume` | FastAPI `/api/v1/resumes` | React Query → `apiRequest` |
| 5 | **Job Hunter** | `/jobs` | FastAPI `/api/v1/jobs` | React Query → `apiRequest` |
| 6 | **Goals & tasks** | `/goals` | FastAPI `/api/v1/goals`, `/tasks` | React Query → `apiRequest` |
| 7 | **Standalone tasks** | `/goals#tasks` | Supabase direct (no FastAPI) | React Query → Supabase client |
| 8 | **Calendar** | `/calendar` | Supabase direct | React Query → Supabase client |
| 9 | **AI Career Assistant** | `/chat` | Next.js Route Handler `POST /api/assistant/chat` | Supabase + Gemini streaming |

### Schema-only / partial features

Tables and Pydantic models exist for **cover letters**, **roadmaps**, **roadmap items**, and **skill gap analysis**, but there are **no dedicated API routes or UI pages** for them yet. The AI assistant detects intents for cover letter and roadmap generation and sets metadata flags (`can_save_cover_letter`, `can_save_roadmap`) but does not persist generated artifacts to those tables.

---

## Tech Stack (detailed)

| Concern | Technology | How it is used |
|---|---|---|
| Frontend framework | Next.js 16 App Router | Server components for auth gates; client components for interactive UI |
| UI | React 19, Tailwind v4 | Utility-first styling; `globals.css` for app-wide tokens |
| Client state / fetching | TanStack React Query v5 | Queries/mutations per feature; 20s default `staleTime` in `providers.tsx` |
| Toasts | Sonner | Success/error feedback on uploads, job search, saves |
| Drag & drop | `@hello-pangea/dnd` | Kanban column reordering at `/tracker` |
| Calendar UI | `react-big-calendar` + `date-fns` | Month/week/day views at `/calendar` |
| Markdown (chat) | `react-markdown` | Renders assistant messages in chat thread |
| Auth (browser) | `@supabase/ssr`, `@supabase/supabase-js` | Cookie-based sessions; server `createClient()` for RSC gates |
| API client | `frontend/src/lib/api.ts` | `apiRequest()` attaches `Authorization: Bearer <access_token>` to FastAPI |
| Backend framework | FastAPI | Routers under `/api/v1`; global CORS + exception handlers in `main.py` |
| Validation | Pydantic v2, pydantic-settings | Request/response models; `Settings` in `app/core/config.py` |
| DB access (backend) | Supabase Python client (service role) | All backend writes bypass RLS via service key; ownership enforced in queries |
| DB migrations | Supabase CLI SQL migrations + Alembic | Supabase: schema/RLS/RPC; Alembic: `embedding_new` column for Gemini dim upgrade |
| Vector search | pgvector on `resume_chunks.embedding` | IVFFlat index; RPC `match_resume_chunks` / `match_resume_chunks_with_resume` |
| Embeddings | **Google Gemini** (`models/embedding-001`, 768-dim default) | `GeminiEmbeddingProvider`; separate `retrieval_document` vs `retrieval_query` task types |
| CV Q&A LLM | **Google Gemini** (cascade: 2.5-pro → 2.5-flash → 2.0-flash → 1.5-flash) | `llm_service.answer_from_chunks()` — grounded RAG answers |
| Assistant chat LLM | **Google Gemini** (`gemini-2.0-flash` default) | Next.js route streams SSE from Generative Language API |
| Skill extraction | Gemini analysis provider + deterministic regex fallback | ~50+ keyword definitions across 6 categories |
| CV parsing | `pypdf`, `python-docx` | PDF/DOCX only; max 10 MB; rejects empty/scanned PDFs |
| Job search API | JSearch via RapidAPI (`httpx`) | `JSearchAdapter`; requires `RAPIDAPI_KEY` |
| Manual job ingest | `ManualPasteAdapter` | `POST /api/v1/jobs/manual` (API ready; no dedicated UI form on `/jobs` yet) |
| Tests | pytest | **130 tests** collected (`test/CV-intelligence/`, `test/job-intelligence/`) |

---

## Repository Structure

```
codesprint-2/
├── backend/
│   ├── main.py                          # FastAPI app, CORS, routers, /health
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── alembic/                         # embedding_new column migration
│   ├── scripts/reembed_resume_chunks.py
│   └── app/
│       ├── core/
│       │   ├── config.py                # Settings: Supabase, Gemini, embeddings, RapidAPI, CORS
│       │   ├── auth.py                  # Bearer JWT → user_id
│       │   ├── database.py              # Supabase service-role singleton
│       │   ├── supabase_errors.py       # HTTP mapping for PostgREST errors
│       │   ├── enums.py                 # ResumeStatus, ApplicationStatus, GoalStatus, etc.
│       │   └── orm/                     # SQLAlchemy ORM mirrors (Alembic / future direct DB)
│       ├── cv_intelligence/
│       │   ├── routes/resumes.py        # 7 endpoints
│       │   ├── models/                  # Resume, ResumeSection, ResumeChunk, UserSkill
│       │   └── services/
│       │       ├── resume_service.py    # Upload pipeline + CRUD
│       │       ├── resume_parser.py     # PDF/DOCX extract + validate
│       │       ├── section_detector.py  # Heading-based section split
│       │       ├── chunker.py           # 900 char / 150 overlap sliding window
│       │       ├── embedding_service.py # Provider facade
│       │       ├── skill_extractor.py   # Provider + regex fallback
│       │       ├── retrieval_service.py # pgvector RPC + numpy fallback
│       │       ├── llm_service.py       # Gemini grounded answers
│       │       ├── reembedding_service.py
│       │       └── providers/
│       │           ├── embeddings/gemini_embeddings.py
│       │           └── analysis/gemini_resume_analysis.py
│       ├── job_intelligence/
│       │   ├── routes/jobs.py           # search, manual, matches, save-to-tracker
│       │   ├── models/                  # Job, JobSearch, JobMatch
│       │   └── services/
│       │       ├── job_service.py       # Orchestration + persistence
│       │       ├── job_scorer.py        # Fit score formula
│       │       └── sources/
│       │           ├── jsearch.py
│       │           └── manual_paste.py
│       └── career_assistant/
│           ├── routes/applications.py   # Kanban CRUD + status RPC
│           ├── routes/goals.py          # Goals + nested tasks
│           ├── models/                  # Application, Goal, Task, assistant_*, cover_letter, roadmap, skill_gap
│           └── services/
│               ├── applications.py
│               └── goals.py
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── app/                         # Pages + assistant API route
│       ├── components/
│       │   ├── nav/AppNav.tsx
│       │   ├── chat/                    # ChatWorkspace, ChatThread, sidebar
│       │   ├── calendar/                # CalendarView, EventModal, popover
│       │   └── tasks/                   # Standalone task list UI
│       ├── features/
│       │   ├── resume/                  # CV Intelligence UI
│       │   ├── tracker/                 # Kanban
│       │   ├── goals/                   # Goals workspace
│       │   └── jobs/                    # Job Hunter
│       └── lib/
│           ├── api.ts                   # FastAPI fetch wrapper
│           ├── gemini.ts                # Stream + intent classification helpers
│           ├── supabase/                # client, server, proxy
│           ├── assistant/               # Prompts, intent detection, resume context
│           └── hooks/                   # Calendar, assistant, standalone tasks
├── supabase/migrations/                 # 9 SQL migration files
├── Docs/
└── docker-compose.yml
```

---

## Feature Implementation Matrix

| Feature | DB tables | Backend API | Frontend UI | Notes |
|---|---|---|---|---|
| **Auth** | `profiles` + `handle_new_user` trigger | `get_current_user` on protected routes | `/login` sign-in/sign-up | Cookie sessions; `?next=` redirect |
| **Landing** | — | — | `/` marketing hub | Links to all modules |
| **Global nav** | — | — | `AppNav` on tracker, jobs, resume, goals | Chat & calendar use own headers |
| **Kanban tracker** | `applications`, `application_history` | Full CRUD + `change_application_status` RPC | `/tracker` DnD board | Manual job fields + job-linked apps |
| **Application history** | `application_history` | Included in detail endpoint | Detail drawer timeline | Written by status RPC |
| **CV upload / parse / embed** | `resumes`, `resume_sections`, `resume_chunks` | `POST /upload` | Upload card + processing strip | Gemini embeddings |
| **CV sections / skills** | `resume_sections`, `user_skills` | `GET /{id}` detail | Expandable sections, skill chips | Skills: Gemini or regex |
| **Semantic search (RAG)** | `resume_chunks` + pgvector | `POST /query` | Raw query box (debug) | min similarity 0.05 |
| **AI CV answers** | — | `POST /answer` | Ask-about-CV panel + evidence | Gemini cascade |
| **Delete resume** | cascade | `DELETE /{id}` | Confirm dialog | |
| **Job search & match** | `job_searches`, `jobs`, `job_matches` | `POST /search`, `GET /matches` | `/jobs` search form + match cards | JSearch source |
| **Manual job match** | same | `POST /manual` | API only (no form UI) | `addManualJob()` in `jobs/api.ts` |
| **Save match → tracker** | `applications` | `POST /matches/{id}/save` | Bookmark on `MatchCard` | Status `saved` |
| **Goals** | `goals` | Goals CRUD | `/goals` cards + filters | Status: active/completed/paused/cancelled |
| **Goal tasks** | `tasks` (with `goal_id`) | Nested under goals routes | Per-goal task list | Priority 1–3 |
| **Standalone tasks** | `tasks` (`goal_id` null) | — (Supabase direct) | `TaskList` on goals page | Overdue/today/week buckets |
| **Calendar** | `calendar_events` | — (Supabase direct) | `/calendar` big-calendar | Also shows application deadlines |
| **AI assistant chat** | `assistant_conversations`, `assistant_messages` | `POST /api/assistant/chat` (Next.js) | `/chat` workspace | Streaming; intent routing |
| **Cover letters** | `cover_letters` | — | — | Schema only |
| **Roadmaps** | `roadmaps`, `roadmap_items` | — | — | Schema only; intent metadata in chat |
| **Skill gap analysis** | `skill_gap_analysis` | — | — | Schema only; intent in chat |
| **Evaluation tests** | `evaluation_tests` | — | — | Schema for benchmarking |
| **Supabase Storage (CV files)** | `resumes.file_url` column | Not used | — | Raw file not stored in bucket |
| **Embedding migration** | `resume_chunks.embedding_new` | `/health` reports progress | — | Alembic + `reembedding_service` |

---

## 1. Authentication

### What it does

- Email/password **sign-up** and **sign-in** via Supabase Auth.
- Sessions stored in **HTTP-only cookies** through `@supabase/ssr`.
- Protected pages call `createClient()` (server) → `getUser()` → `redirect("/login?next=…")` if unauthenticated.
- FastAPI routes require `Authorization: Bearer <access_token>`; `get_current_user()` validates via `supabase.auth.get_claims()` or `get_user()`.
- On sign-up, `handle_new_user()` trigger creates a `profiles` row.

### Key files

| Area | Path |
|---|---|
| Login UI | `frontend/src/app/login/login-form.tsx`, `page.tsx` |
| Supabase browser | `frontend/src/lib/supabase/client.ts` |
| Supabase server | `frontend/src/lib/supabase/server.ts` |
| Backend auth | `backend/app/core/auth.py` |
| Profiles trigger | `supabase/migrations/20250525000001_initial_schema.sql` |

### Mechanism

```
Browser → Supabase Auth (signIn/signUp)
  → Session cookie (SSR-managed)
  → Server page: getUser() gate
  → Client: apiRequest() reads session.access_token
  → FastAPI: HTTPBearer → get_current_user() → user_id
  → All DB queries: .eq("user_id", user_id)
```

---

## 2. Global Navigation & Landing

### AppNav (`frontend/src/components/nav/AppNav.tsx`)

Sticky top bar on **Job Tracker**, **Job Hunter**, **CV Intelligence**, and **Goals**:

| Link | Path |
|---|---|
| Job Tracker | `/tracker` |
| Job Hunter | `/jobs` |
| CV Intelligence | `/resume` |
| Goals | `/goals` |

Active route highlighting via `usePathname()`.

### Landing page (`frontend/src/app/page.tsx`)

Public marketing page listing live modules (chat, tracker, goals, calendar, tasks, resume) and a “coming next” section (skill gap, roadmaps, cover letters, dashboard, nudges). No auth required.

---

## 3. Kanban Application Tracker (`/tracker`)

### Status workflow

`saved` → `applied` → `interviewing` → `offer` → `rejected`

### Backend (`/api/v1/applications`)

| Method | Path | Service function | Behavior |
|---|---|---|---|
| `GET` | `` | `list_applications` | Optional `status_filter` query param |
| `POST` | `` | `create_application` | Manual application; requires `manual_job_title` or `job_id` |
| `GET` | `/{id}` | `get_application_detail` | Application + `application_history` timeline |
| `PATCH` | `/{id}` | `update_application` | Edit title, company, location, notes, deadline |
| `PATCH` | `/{id}/status` | `change_application_status` | Calls Postgres RPC `change_application_status` |
| `DELETE` | `/{id}` | `delete_application` | Hard delete |

### Status change RPC

`change_application_status` (migration `20250525153000_kanban_manual_applications.sql`):

- Row-level lock (`FOR UPDATE`)
- Updates `applications.status` and `updated_at`
- Inserts `application_history` row when status actually changes
- `SECURITY DEFINER` with `search_path = public`

### Frontend (`frontend/src/features/tracker/`)

| File | Role |
|---|---|
| `tracker-board.tsx` | Main Kanban; `@hello-pangea/dnd` columns per status |
| `kanban-column.tsx` | Column container + droppable |
| `application-card.tsx` | Card preview; opens detail drawer |
| `add-application-drawer.tsx` | Create manual application form |
| `application-detail-drawer.tsx` | Edit fields, status change, history timeline, delete |
| `api.ts` / `hooks.ts` / `types.ts` | Typed API + React Query mutations |
| `format.ts` | Display helpers for title/company |

### Optional filter

`?status=applied` (etc.) supported via page search params → filters list query.

---

## 4. CV Intelligence (`/resume`)

### Page composition

`resume-page-client.tsx` orchestrates:

- Resume selector (list from `GET /resumes`)
- `resume-upload-card.tsx` — drag-and-drop PDF/DOCX, animated processing strip
- `resume-summary.tsx` — skeleton, expandable sections, category-colored skill chips, delete + retry
- `resume-answer-box.tsx` — “Ask about your CV”, sample chips, answer + collapsible evidence with similarity bars
- `resume-query-box.tsx` — raw semantic chunk search (dev/debug)

### Upload pipeline (`POST /api/v1/resumes/upload`)

Implemented in `resume_service.process_resume()`:

```
validate_file (PDF/DOCX, ≤10 MB)
  → INSERT resumes (status=processing, is_active=true)
  → extract_text (pypdf / python-docx, whitespace normalize)
  → detect_sections (keyword headings → fallback "general" section)
  → INSERT resume_sections
  → chunk_sections (900 chars, 150 overlap, global chunk_index)
  → embed_document_batch (Gemini, task_type=retrieval_document)
  → INSERT resume_chunks (embedding column per EMBEDDING_ACTIVE_COLUMN)
  → extract_skills (GeminiResumeAnalysisProvider → regex fallback)
  → UPSERT user_skills (on_conflict user_id,skill_name)
  → Deactivate other resumes (is_active=false)
  → UPDATE resumes (status=processed, raw_text, parsed_summary jsonb)
  → On failure: status=failed, error_message stored (max 2000 chars)
```

### Section detection (`section_detector.py`)

Scans lines for known heading keywords (Experience, Education, Skills, etc.). Unmatched content goes to a **general** section. Each section has `section_name`, `section_order`, `content`.

### Skill extraction (`skill_extractor.py`)

1. **Primary:** `GeminiResumeAnalysisProvider.extract_skills(text)` when `ANALYSIS_BACKEND=gemini`
2. **Fallback:** Deterministic regex over ~50+ skills in categories: language, framework, database, cloud, tool, soft
3. Each skill includes `skill_name`, `category`, `evidence` (surrounding text window)

### Embeddings (`providers/embeddings/gemini_embeddings.py`)

- Model: `GEMINI_EMBEDDING_MODEL` (default `models/embedding-001`)
- Dimension: `EMBEDDING_VECTOR_DIM` (default **768**)
- `embed_documents()` vs `embed_query()` use different Gemini `task_type` values
- Validates vector length before insert/retrieval

### Retrieval (`retrieval_service.py`)

1. Embed query via `embed_query_text()`
2. Try Supabase RPC `match_resume_chunks` or `match_resume_chunks_with_resume` (cosine distance `<=>`)
3. On RPC failure/empty → **numpy cosine fallback** over fetched chunks
4. Filter `similarity < 0.05` (configurable `MIN_SIMILARITY`)
5. Dimension mismatch → HTTP 503 when `RETRIEVAL_REQUIRE_DIM_MATCH=true` (migration guardrail)

**Note:** Supabase migration RPCs are defined for `vector(384)` while runtime default is **768**. Production must align RPC signature, column type, and `EMBEDDING_VECTOR_DIM` (see Alembic `embedding_new` migration path).

### AI answer pipeline (`POST /api/v1/resumes/answer`)

```
embed question (retrieval_query)
  → search_chunks (top_k, optional resume_id scope)
  → llm_service.answer_from_chunks() — Gemini with hallucination-prevention system prompt
  → { answer, evidence_chunks[] }
```

Model cascade on quota errors: `gemini-2.5-pro` → `gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-1.5-flash`.

### Resume API summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Multipart file → full pipeline |
| `GET` | `` | List resumes (newest first) |
| `GET` | `/{id}` | Detail: sections + skills + chunk_count |
| `GET` | `/{id}/chunks` | All chunks (no embeddings in response) |
| `POST` | `/query` | Semantic search → top-k chunks |
| `POST` | `/answer` | RAG + Gemini answer + evidence |
| `DELETE` | `/{id}` | Cascade delete sections/chunks; skills `resume_id` → null |

### Re-embedding migration

- Alembic adds `resume_chunks.embedding_new vector(768)` + IVFFlat index
- `reembedding_service.py` batch-backfills null `embedding_new` rows
- `GET /health` returns `embedding_migration` progress counts
- `EMBEDDING_ACTIVE_COLUMN` switches retrieval column (`embedding` vs `embedding_new`)

---

## 5. Job Hunter / Job Intelligence (`/jobs`)

### Backend routes (`/api/v1/jobs`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/search` | JSearch (or other source) → score → persist `job_searches`, `jobs`, `job_matches` |
| `POST` | `/manual` | User-pasted JD → single job → score → persist |
| `GET` | `/matches` | List stored matches (`resume_id`, `min_score`, `limit` filters) |
| `POST` | `/matches/{match_id}/save` | Create `applications` row (`status=saved`, links `job_id`, `job_match_id`) |

### Search orchestration (`job_service.search_and_match`)

```
_persist_search (job_searches row)
  → source.search(query, location, limit)  [JSearchAdapter | ManualPasteAdapter]
  → _persist_jobs (jobs table; may duplicate on repeat searches)
  → For each job: job_scorer.score_job()
  → _persist_matches (upsert on user_id, job_id, resume_id)
  → Return sorted matches (fit_score desc)
```

### JSearch adapter (`sources/jsearch.py`)

- HTTP GET `https://{RAPIDAPI_HOST}/search` via `httpx`
- Headers: `x-rapidapi-key`, `x-rapidapi-host`
- Normalizes RapidAPI response → `JobCreate` models (title, company, location, description, etc.)
- Requires `RAPIDAPI_KEY` in backend `.env`

### Manual paste adapter (`sources/manual_paste.py`)

Parses title, description, company, location, source_url into a single `JobCreate`. Used by `POST /jobs/manual`.

### Fit scoring (`job_scorer.py`)

```
fit_score = round(100 * (0.6 * skills_overlap_ratio + 0.4 * mean_chunk_similarity), 2)

skills_overlap_ratio = |jd_skills ∩ user_skills| / |jd_skills|  (0 if no JD skills)
mean_chunk_similarity = mean of top-5 resume chunk similarities for JD text
```

- JD skills: same `extract_skills()` as CV (regex path in scorer)
- Chunk similarity: `retrieval_service.search_chunks()` scoped to `resume_id`
- Stores `evidence_chunk_ids` on `job_matches`

### Frontend (`frontend/src/features/jobs/`)

| File | Role |
|---|---|
| `jobs-page-client.tsx` | Resume picker, search form, match list |
| `search-form.tsx` | Query, location, source (JSearch), submit |
| `match-card.tsx` | Fit score badge, matched/missing skills, save-to-tracker |
| `api.ts` | `searchJobs`, `listMatches`, `addManualJob`, `saveMatchToTracker` |
| `hooks.ts` | `useJobMatches`, `useSearchJobs`, `useSaveMatchToTracker` |

Requires at least one **processed** resume (prompts user to upload on `/resume` if none).

---

## 6. Goals & Tasks (`/goals`)

### Backend — Goals (`/api/v1/goals`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/goals` | List with embedded task counts; optional `status_filter` |
| `POST` | `/goals` | Create goal |
| `GET` | `/goals/{id}` | Goal detail + tasks |
| `PATCH` | `/goals/{id}` | Update title, description, status, target_date |
| `DELETE` | `/goals/{id}` | Delete goal |
| `GET` | `/goals/{id}/tasks` | List tasks for goal |
| `POST` | `/goals/{id}/tasks` | Create task under goal |
| `PATCH` | `/tasks/{id}` | Update any owned task |
| `DELETE` | `/tasks/{id}` | Delete task |

Goal statuses: `active`, `completed`, `paused`, `cancelled`.  
Task statuses: `todo`, `in_progress`, `done`, `cancelled`. Priority: `1` (high) – `3` (low).

### Frontend (`frontend/src/features/goals/`)

| File | Role |
|---|---|
| `goals-workspace.tsx` | Filter tabs, goal grid, links to calendar/tracker, embeds `TaskList` |
| `goal-card.tsx` | Summary card; expand tasks |
| `goal-form-drawer.tsx` | Create/edit goal |
| `task-row.tsx`, `task-list.tsx`, `task-form.tsx` | Per-goal task CRUD |
| `api.ts` / `hooks.ts` / `types.ts` | FastAPI integration |

### Standalone tasks (Supabase direct)

`frontend/src/lib/hooks/useTasks.ts` and `frontend/src/components/tasks/`:

- Queries `tasks` where user owns row (goal-linked or standalone)
- Buckets: overdue, today, this week, later
- `TaskQuickAdd`, `TaskItem`, `TaskList` — no FastAPI layer

---

## 7. Calendar (`/calendar`)

### Data access

**No FastAPI routes.** All CRUD via Supabase client in `useCalendarEvents.ts`:

- `calendar_events` table: title, description, `event_type`, start/end, reminder, optional `task_id`, `application_id`
- Event types: `deadline`, `interview`, `reminder`, `study`, `application`, `custom`
- Also synthesizes **application deadline** events from `applications` + linked `jobs` rows

### UI (`frontend/src/components/calendar/`)

| Component | Role |
|---|---|
| `CalendarView.tsx` | `react-big-calendar` month/week/day; sign-out; links to tracker |
| `EventModal.tsx` | Create/edit modal with type, times, links to task/application |
| `EventPopover.tsx` | Quick view on select |
| `UpcomingSidebar.tsx` | Upcoming events list |

Auth gate: server `getUser()` in `app/calendar/page.tsx`.

---

## 8. AI Career Assistant (`/chat`)

### Architecture

Unlike CV/tracker/goals/jobs, the assistant runs through a **Next.js Route Handler**, not FastAPI:

`POST /api/assistant/chat` → `frontend/src/app/api/assistant/chat/route.ts`

### Flow

```
User message in ChatThread
  → POST /api/assistant/chat { conversationId, message }
  → Server: supabase.auth.getUser()
  → Load profile, conversation, last 12 messages (loadConversationMemory)
  → detectAssistantIntent(message) — rules first, then Gemini classifier
  → buildSystemPrompt(profile, resumeContext) + buildIntentPrompt(intent, …)
  → createGeminiStream() — SSE from Generative Language API
  → Stream tokens to client (text/plain)
  → On complete: INSERT assistant_messages, UPDATE conversation title
```

### Intent detection (`lib/assistant/detectIntent.ts`)

| Intent | Example triggers |
|---|---|
| `readiness_check` | “Am I ready for…”, interview prep |
| `skill_gap` | “What skills am I missing…” |
| `roadmap_generation` | “Create a learning roadmap…” |
| `cover_letter` | “Write a cover letter…” |
| `general` | Fallback |

Methods: `rule` (regex patterns) → `model` (Gemini `GEMINI_INTENT_MODEL`) → `fallback`.

### Resume context (current limitation)

`getResumeContext.ts` currently returns **`mockCV` static data**, not live Supabase resume chunks. Production wiring should call retrieval or active resume `raw_text`.

### Conversation UI

| File | Role |
|---|---|
| `ChatWorkspace.tsx` | Sidebar + thread layout |
| `ConversationSidebar.tsx` | List/create/delete conversations |
| `ChatThread.tsx` | Message list + streaming composer |
| `ChatMessage.tsx` | User/assistant bubble + markdown |
| `MessageComposer.tsx` | Send input |
| `useAssistantConversations.ts` | Optimistic create with `temp-*` IDs |
| `useAssistantMessages.ts` | Per-conversation message history |

### Persistence

| Table | Purpose |
|---|---|
| `assistant_conversations` | `title`, `context` jsonb, timestamps |
| `assistant_messages` | `role`, `content`, `used_resume_chunks[]`, `used_job_id`, `metadata` jsonb |

Metadata on assistant messages includes: `intent`, `intent_confidence`, `model`, `streamed`, `can_save_roadmap`, `can_save_cover_letter`.

---

## How Things Are Connected

### Authenticated FastAPI request

```
Browser
  → Supabase session cookie + access_token
  → apiRequest(path) adds Authorization: Bearer
  → FastAPI CORSMiddleware (settings.cors_origins)
  → get_current_user()
  → Service layer → get_supabase_client() (service role)
  → Postgres with RLS bypassed; user_id enforced in Python
```

### CV upload (end-to-end)

```
/resume → useUploadResume → FormData POST /api/v1/resumes/upload
  → resume_service.process_resume()
  → parser → sections → chunker → Gemini embed → Supabase inserts
  → skills upsert → React Query invalidation → Sonner toast
```

### Job search (end-to-end)

```
/jobs → useSearchJobs → POST /api/v1/jobs/search
  → JSearchAdapter → job_scorer (skills + RAG similarity)
  → job_matches persisted → useJobMatches refetch
  → MatchCard → saveMatchToTracker → POST …/save → Kanban "saved"
```

### Assistant chat (end-to-end)

```
/chat → useAssistantMessages + fetch /api/assistant/chat
  → Gemini stream → ChatThread renders tokens
  → Messages persisted in assistant_messages
```

---

## Database Schema

Authoritative source: `supabase/migrations/20250525000001_initial_schema.sql` (+ follow-up migrations).

### Core / auth

| Table | Key columns / notes |
|---|---|
| `profiles` | `id` (= auth.users), `full_name`, `email`, `target_role`, `location`, `bio` |
| `evaluation_tests` | Benchmarking harness metadata |

### CV Intelligence

| Table | Key columns |
|---|---|
| `resumes` | `file_name`, `file_type`, `file_url`, `raw_text`, `parsed_summary` jsonb, `status`, `is_active`, `error_message` |
| `resume_sections` | `section_name`, `section_order`, `content`, `metadata` |
| `resume_chunks` | `chunk_index`, `chunk_text`, `token_count`, `embedding vector(384)` [*], `metadata` |
| `user_skills` | `skill_name`, `category`, `proficiency`, `evidence`, `source`; unique `(user_id, skill_name)` |

[*] Runtime default dimension is **768** via Gemini; use Alembic `embedding_new` + migration alignment for production.

### Job Intelligence

| Table | Key columns |
|---|---|
| `job_searches` | `query`, `location`, `filters` jsonb, `source` |
| `jobs` | `title`, `company`, `location`, `description`, `requirements`, `source`, `source_url`, `search_id` |
| `job_matches` | `fit_score`, `matched_skills[]`, `missing_skills[]`, `explanation`, `evidence_chunks` jsonb; unique `(user_id, job_id, resume_id)` |

### Career assistant / productivity

| Table | Key columns |
|---|---|
| `applications` | `status`, `job_id`, `job_match_id`, `manual_job_title`, `manual_company`, `manual_location`, `deadline`, `notes` |
| `application_history` | `old_status`, `new_status`, `note`, `changed_at` |
| `goals` | `title`, `description`, `status`, `target_date` |
| `tasks` | `goal_id` (nullable), `title`, `status`, `priority`, `due_date`, `roadmap_item_id`, `application_id` |
| `calendar_events` | `event_type`, `start_time`, `end_time`, `reminder_time`, `task_id`, `application_id` |
| `assistant_conversations` | `title`, `context` jsonb |
| `assistant_messages` | `role`, `content`, `used_resume_chunks`, `used_job_id`, `metadata` |

### Schema-only (no API/UI yet)

| Table | Purpose |
|---|---|
| `cover_letters` | Generated letters per job/application |
| `roadmaps` / `roadmap_items` | Structured learning plans |
| `skill_gap_analysis` | Stored gap reports |

### Security

- **RLS enabled** on all user tables (policies in initial migration).
- Backend uses **service role** key → must enforce `user_id` in every query.
- Frontend uses **anon key** + user JWT → RLS applies for direct Supabase reads/writes.

### Indexes & RPC

- IVFFlat index on `resume_chunks.embedding` (cosine ops)
- `match_resume_chunks(query_embedding, match_user_id, match_count)`
- `match_resume_chunks_with_resume(..., match_resume_id, ...)`
- `change_application_status(p_application_id, p_user_id, p_new_status, p_note)`

---

## Migrations

| File | Description |
|---|---|
| `20250525000001_initial_schema.sql` | Full schema, enums, RLS, pgvector, `handle_new_user`, IVFFlat |
| `20250525153000_kanban_manual_applications.sql` | Manual job columns + `change_application_status` RPC |
| `20250525170000_goals_tasks_priority.sql` | Priority constraints on tasks |
| `20250526001000_goals_tasks_grants.sql` | Grants for goals/tasks |
| `20250526003000_calendar_grants.sql` | Grants for calendar_events |
| `20250526005000_assistant_conversation_grants.sql` | Grants for assistant tables |
| `20250526120000_resume_cv_grants.sql` | Grants for CV tables (fixes SQLSTATE 42501) |
| `20250527000000_match_resume_chunks_rpc.sql` | pgvector similarity RPC functions |
| `20260528000000_job_intelligence_grants.sql` | Grants for job_searches, jobs, job_matches |

**Alembic** (direct Postgres via `DATABASE_URL`):

- `2b7f66d7a1b2_gemini_embedding_dimension_upgrade.py` — adds `embedding_new vector(768)` + index

Apply Supabase migrations:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

---

## Environment Variables

### Frontend (`frontend/.env` / `.env.local`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe anon key |
| `NEXT_PUBLIC_API_URL` | FastAPI base (e.g. `http://localhost:8000`) |
| `GEMINI_API_KEY` | Assistant route + intent classification (server-side in Route Handler) |
| `GEMINI_MODEL` | Chat model (default `gemini-2.0-flash`) |
| `GEMINI_INTENT_MODEL` | Intent classifier (default `gemini-2.0-flash-lite`) |

### Backend (`backend/.env`)

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Bare project URL (no `/rest/v1/`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role |
| `SUPABASE_ANON_KEY` | Optional anon client |
| `DATABASE_URL` | Postgres URL for Alembic |
| `GEMINI_API_KEY` | Embeddings, analysis, `/answer` |
| `EMBEDDING_BACKEND` | `gemini` (only supported value) |
| `ANALYSIS_BACKEND` | `gemini` |
| `GEMINI_EMBEDDING_MODEL` | Default `models/embedding-001` |
| `EMBEDDING_VECTOR_DIM` | Default `768` |
| `EMBEDDING_ACTIVE_COLUMN` | `embedding` or `embedding_new` |
| `RETRIEVAL_REQUIRE_DIM_MATCH` | `true` — fail on dim mismatch |
| `RAPIDAPI_KEY` | JSearch job search |
| `RAPIDAPI_HOST` | Default `jsearch.p.rapidapi.com` |
| `CORS_ORIGINS` | Allowed browser origins |
| `DEBUG` | FastAPI debug mode |

---

## Backend Cross-Cutting Concerns

| Module | Role |
|---|---|
| `main.py` | Registers routers; CORS on all responses including 500s |
| `core/config.py` | `pydantic-settings` with env aliases |
| `core/supabase_errors.py` | `run_supabase()` wrapper; maps PostgREST errors to HTTP |
| `core/enums.py` | Shared string enums matching Postgres types |
| `core/orm/` | SQLAlchemy models for Alembic / future SQLAlchemy usage |
| `_helpers.py` (per domain) | `_row()`, `_rows()` for Supabase response normalization |

### Health check

`GET /health` → `{ status: "ok", embedding_migration: { … } }`

---

## Frontend Cross-Cutting Concerns

| Module | Role |
|---|---|
| `app/layout.tsx` | Root layout + `Providers` (React Query + Sonner) |
| `app/providers.tsx` | QueryClient defaults |
| `lib/api.ts` | Authenticated fetch to FastAPI |
| `lib/supabase/client.ts` | Browser Supabase |
| `lib/supabase/server.ts` | Server Component / Route Handler Supabase |
| Feature pattern | `api.ts` + `hooks.ts` + `types.ts` + UI components per domain |

---

## Testing

```bash
cd backend
python -m pytest -v
# 130 tests collected (CV-intelligence + job-intelligence)
```

| Suite | Covers |
|---|---|
| `test/CV-intelligence/` | Parser, chunker, sections, skills, embeddings, retrieval guardrails, Gemini providers, re-embedding |
| `test/job-intelligence/` | JSearch adapter, manual paste, job_service, job_scorer |

---

## What Is Not Yet Implemented

| Item | Status |
|---|---|
| **Cover letter generation UI** | DB + chat intent only; no save to `cover_letters` |
| **Roadmap generator UI** | DB + chat intent metadata; no save to `roadmaps` |
| **Skill gap analysis UI** | DB + chat intent; no `skill_gap_analysis` writes |
| **Live resume context in chat** | Uses `mockCV` instead of Supabase/RAG |
| **Manual job paste UI on `/jobs`** | Backend `POST /jobs/manual` + `addManualJob()` exist; no form in search UI |
| **Supabase Storage for CV files** | `file_url` column unused |
| **Proficiency inference** | `proficiency` column exists; not populated |
| **OCR for scanned PDFs** | Out of scope; empty text → 422 |
| **Job intelligence in AppNav** | Jobs linked from landing; chat/calendar separate nav |
| **Progress dashboard / AI nudges** | Listed on landing “coming next” only |
| **pgvector RPC dimension alignment** | Migration SQL uses `vector(384)`; app defaults to 768 — must reconcile in deployment |

---

## Related Documentation

| Document | Purpose |
|---|---|
| [`cv-intelligence-implementation.md`](cv-intelligence-implementation.md) | CV pipeline design and code map |
| [`cv-intelligence-notes-and-fixes.md`](cv-intelligence-notes-and-fixes.md) | Grants, CORS, embeddings, pgvector troubleshooting |
| [`db-design-initial.md`](db-design-initial.md) | Original schema design reference |
| [`README.md`](../README.md) | Quick start (note: some stack details may lag behind this doc) |
