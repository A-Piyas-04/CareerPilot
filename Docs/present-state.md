# CareerPilot — Present State

> Last updated: May 26, 2026

---

## Overview

CareerPilot is a hackathon career platform that helps users manage their job search lifecycle — from CV intelligence and job matching to application tracking and AI-assisted career planning. The project is a full-stack monorepo with a **Next.js 16 frontend**, a **FastAPI backend**, and **Supabase** as the auth + database layer.

Two complete vertical features are wired end-to-end:

1. **Kanban job application tracker** — full CRUD + drag-and-drop status changes, frontend + backend
2. **CV Intelligence backend** — PDF/DOCX upload, text extraction, section detection, chunking, 384-dim embeddings, RAG retrieval, skill extraction (backend API only, no frontend UI yet)

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 | Turbopack in dev |
| Styling | Tailwind CSS v4 | |
| State / Data | TanStack React Query | |
| Drag & Drop | `@hello-pangea/dnd` | Kanban board |
| Auth (client) | `@supabase/ssr`, `@supabase/supabase-js` | Cookie-based sessions |
| Backend | FastAPI + Uvicorn, Python 3.11 | |
| Validation | Pydantic v2, pydantic-settings | |
| Database | Supabase (PostgreSQL 15) | RLS on all tables |
| Vector search | pgvector — `vector(384)` on `resume_chunks` | Cosine similarity retrieval |
| CV Embeddings | `sentence-transformers/all-MiniLM-L6-v2` (384-dim) | Lazy-loaded singleton |
| CV Parsing | `pypdf` (PDF), `python-docx` (DOCX) | |
| Containers | Docker Compose | Backend :8000, Frontend :3000 |
| Migrations | Supabase CLI (`supabase db push`) | |

---

## Repository Structure

```
codesprint-2/
├── backend/                    # FastAPI application
│   ├── main.py                 # App entry point, CORS, router registration
│   ├── requirements.txt        # pypdf, python-docx, sentence-transformers, numpy, supabase…
│   ├── Dockerfile
│   ├── .env.example
│   └── app/
│       ├── core/               # Config, auth, database clients, enums, base models
│       ├── career_assistant/   # Models, routes, services — applications fully wired
│       ├── cv_intelligence/
│       │   ├── models/         # Resume, ResumeSection, ResumeChunk, UserSkill
│       │   ├── routes/
│       │   │   └── resumes.py  # 5 endpoints: upload, list, detail, chunks, query
│       │   └── services/
│       │       ├── resume_service.py     # Pipeline orchestrator + read operations
│       │       ├── resume_parser.py      # PDF/DOCX text extraction
│       │       ├── section_detector.py   # Keyword-based heading detection
│       │       ├── chunker.py            # 900-char / 150-overlap sliding window
│       │       ├── embedding_service.py  # all-MiniLM-L6-v2 singleton
│       │       ├── skill_extractor.py    # Deterministic regex, 50+ skills
│       │       └── retrieval_service.py  # pgvector RPC + numpy cosine fallback
│       └── job_intelligence/   # Models only (no routes yet)
│   └── test/
│       └── CV-intelligence/    # 96 unit tests for CV pipeline (95 pass, 1 skipped)
├── frontend/                   # Next.js application
│   ├── Dockerfile
│   ├── next.config.ts
│   └── src/
│       ├── app/                # App Router pages (root, login, tracker)
│       ├── features/tracker/   # Kanban feature (components, api, hooks, types)
│       └── lib/                # Supabase clients, API fetch wrapper, env
├── supabase/
│   ├── config.toml             # Local Supabase CLI project config
│   └── migrations/             # SQL migration files
├── Docs/
│   ├── db-design-initial.md    # Full schema design reference (~1400 lines)
│   └── present-state.md        # This file
├── docker-compose.yml
├── .env                        # Shared env (used by Docker Compose, gitignored)
└── package.json                # Root: Supabase CLI dependency only
```

---

## Feature Implementation Matrix

| Feature | Database | Backend Models | Backend API | Frontend UI |
|---|---|---|---|---|
| **Auth (Supabase)** | `profiles` + trigger | `profile.py` | — | ✅ Login page + session cookies |
| **Kanban Tracker** | `applications` + RPC | `application.py` | ✅ Full CRUD + status | ✅ Full Kanban board |
| **Application History** | `application_history` | `application_history.py` | ✅ In detail endpoint | ✅ Detail drawer timeline |
| **CV Upload / Parse / RAG** | `resumes`, `resume_sections`, `resume_chunks` | `resume.py`, `resume_section.py`, `resume_chunk.py` | ✅ Upload, list, detail, chunks, query | — |
| **User Skills (from CV)** | `user_skills` | `user_skill.py` | ✅ Extracted on upload | — |
| Job Search | `job_searches`, `jobs` | `job_search.py`, `job.py` | — | — |
| Job Matching | `job_matches` | `job_match.py` | — | — |
| AI Chat / Assistant | `assistant_conversations`, `assistant_messages` | `assistant_conversation.py`, `assistant_message.py` | — | — |
| Cover Letter Gen | `cover_letters` | `cover_letter.py` | — | — |
| Roadmaps | `roadmaps`, `roadmap_items` | `roadmap.py`, `roadmap_item.py` | — | — |
| Goals & Tasks | `goals`, `tasks` | `goal.py`, `task.py` | — | — |
| Calendar Events | `calendar_events` | `calendar_event.py` | — | — |
| Skill Gap Analysis | `skill_gap_analysis` | `skill_gap_analysis.py` | — | — |
| Evaluation Tests | `evaluation_tests` | `evaluation.py` | — | — |

---

## What Is Fully Implemented

### Authentication

- Email + password sign-up and sign-in via Supabase Auth.
- Sessions are stored in HTTP-only cookies using `@supabase/ssr`.
- The `/tracker` page is server-side auth-gated — unauthenticated users are redirected to `/login?next=/tracker`.
- A `profiles` row is automatically created for every new Supabase auth user via a `handle_new_user()` database trigger.

**Frontend files:**
- `src/app/login/page.tsx` — Login page
- `src/app/login/login-form.tsx` — Sign in / sign up form
- `src/lib/supabase/client.ts` — Browser Supabase client
- `src/lib/supabase/server.ts` — Server-side Supabase client (cookie-based)
- `src/lib/supabase/proxy.ts` — Session refresh helper

---

### Kanban Application Tracker (`/tracker`)

The tracker is a full drag-and-drop Kanban board for managing job applications across statuses.

**Application statuses (columns):**
`saved` → `applied` → `screening` → `interviewing` → `offered` → `accepted` → `rejected` → `withdrawn`

**Capabilities:**
- Add a manual application (job title, company, location, notes, deadline)
- Drag cards between columns to change status (writes history atomically via DB RPC)
- Click a card to open a detail drawer (edit fields, view full status history timeline, delete)
- Filter by status via query param
- Sign out

**Frontend components (`src/features/tracker/`):**

| File | Role |
|---|---|
| `tracker-board.tsx` | Root board: loads data, manages drag-drop, sign-out |
| `kanban-column.tsx` | Single column with droppable zone |
| `application-card.tsx` | Card UI |
| `add-application-drawer.tsx` | Slide-in form to create a new application |
| `application-detail-drawer.tsx` | Slide-in view/edit/delete + status history |
| `api.ts` | Typed API client calling the FastAPI backend |
| `hooks.ts` | React Query hooks wrapping the API client |
| `types.ts` | TypeScript types + status label/color maps |
| `format.ts` | Date and display helpers |

**Backend API (`/api/v1/applications`):**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/applications` | List authenticated user's applications (optional `?status_filter=`) |
| `POST` | `/api/v1/applications` | Create a new manual application |
| `GET` | `/api/v1/applications/{id}` | Get application detail including full status history |
| `PATCH` | `/api/v1/applications/{id}` | Update application fields (notes, deadline, etc.) |
| `PATCH` | `/api/v1/applications/{id}/status` | Change status (calls `change_application_status` DB RPC) |
| `DELETE` | `/api/v1/applications/{id}` | Delete application |

**Backend files:**
- `backend/main.py` — FastAPI app, CORS, router registration
- `backend/app/core/config.py` — Settings via pydantic-settings
- `backend/app/core/auth.py` — JWT validation via Supabase `get_user(token)`
- `backend/app/core/database.py` — Supabase service-role client factory
- `backend/app/core/enums.py` — Shared Python enums
- `backend/app/career_assistant/routes/applications.py` — Route handlers
- `backend/app/career_assistant/services/applications.py` — DB operations

---

### CV Intelligence (backend API)

A fully automated CV ingestion pipeline exposed as a REST API. The frontend UI is pending.

**Upload pipeline (triggered by `POST /api/v1/resumes/upload`):**

```
Receive PDF or DOCX (max 10 MB)
  → validate_file (extension + size)
  → INSERT resumes row (status = processing)
  → extract_text (pypdf / python-docx + whitespace normalisation)
  → detect_sections (keyword heading matching, falls back to "general")
  → INSERT resume_sections
  → chunk_sections (900-char window, 150-char overlap, global chunk_index)
  → embed_batch (all-MiniLM-L6-v2 → list[float] length 384)
  → INSERT resume_chunks (with vector(384) embedding)
  → extract_skills (regex over 50+ canonical keywords, 6 categories)
  → UPSERT user_skills (unique on user_id + skill_name)
  → UPDATE other resumes SET is_active = false
  → UPDATE resumes SET status = processed, raw_text, parsed_summary
  → Return Resume JSON
  (On any failure → status = failed, error_message stored)
```

**Endpoints (`/api/v1/resumes`):**

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/resumes/upload` | Upload PDF/DOCX — runs full pipeline |
| `GET` | `/api/v1/resumes` | List current user's resumes, newest first |
| `GET` | `/api/v1/resumes/{resume_id}` | Resume detail + sections + skills + chunk count |
| `GET` | `/api/v1/resumes/{resume_id}/chunks` | All chunks for a resume |
| `POST` | `/api/v1/resumes/query` | Semantic search: embed query → cosine similarity over chunks |

**Query endpoint request body:**
```json
{
  "query": "Python FastAPI experience",
  "resume_id": "optional-uuid",
  "top_k": 5
}
```

**Retrieval strategy:** Tries `match_resume_chunks` Supabase RPC (pgvector) first; falls back to fetching all chunks and ranking with numpy cosine similarity in Python.

**Skill categories extracted:** `language`, `framework`, `database`, `devops`, `cloud`, `ml/ai`

**Backend service files:**
- `backend/app/cv_intelligence/routes/resumes.py` — Route handlers + response schemas
- `backend/app/cv_intelligence/services/resume_service.py` — Pipeline orchestrator
- `backend/app/cv_intelligence/services/resume_parser.py` — pypdf / python-docx extraction
- `backend/app/cv_intelligence/services/section_detector.py` — Heading detection
- `backend/app/cv_intelligence/services/chunker.py` — Sliding-window chunker
- `backend/app/cv_intelligence/services/embedding_service.py` — Model singleton, embed_text/batch
- `backend/app/cv_intelligence/services/skill_extractor.py` — Deterministic skill regex
- `backend/app/cv_intelligence/services/retrieval_service.py` — pgvector RPC + numpy fallback

**Unit tests (`backend/test/CV-intelligence/`):**

| File | Tests | Result |
|---|---|---|
| `test_resume_parser.py` | 18 | 17 passed, 1 skipped (reportlab not installed) |
| `test_section_detector.py` | 18 | 18 passed |
| `test_chunker.py` | 16 | 16 passed |
| `test_skill_extractor.py` | 30 | 30 passed |
| `test_embedding_service.py` | 13 | 13 passed |
| **Total** | **95** | **95 passed, 1 skipped** |

Run all fast tests (no model needed):
```bash
cd backend
python -m pytest test/CV-intelligence/test_resume_parser.py test/CV-intelligence/test_section_detector.py test/CV-intelligence/test_chunker.py test/CV-intelligence/test_skill_extractor.py -v
```

Run embedding tests (model must be cached):
```bash
python -m pytest test/CV-intelligence/test_embedding_service.py -v
```

---

## How Things Are Connected

### Request Flow (Authenticated API Call)

```
Browser
  │
  │  1. User signs in at /login
  ▼
Supabase Auth ──► Issues access_token (JWT), stored as session cookie
  │
  │  2. User visits /tracker or calls any /api/v1/* endpoint
  ▼
Next.js Server (tracker/page.tsx)
  │  supabase.auth.getUser()  →  redirect to /login if no session
  ▼
TrackerBoard (client component)
  │  React Query → api.ts → fetch(NEXT_PUBLIC_API_URL + "/api/v1/...")
  │  Authorization: Bearer <access_token>
  ▼
FastAPI Backend
  │  get_current_user() dependency → supabase.auth.get_user(token) → user_id
  │  Service layer → supabase (service role) → Postgres
  │  All queries include .eq("user_id", user_id) — no cross-user data leakage
  ▼
Supabase Postgres
  (service role bypasses RLS; ownership enforced in Python query layer)
```

### CV Upload Flow

```
POST /api/v1/resumes/upload  (multipart/form-data, file)
  ▼
resume_parser.validate_file()     — extension + size guard
  ▼
resume_parser.extract_text()      — pypdf / python-docx → normalised string
  ▼
section_detector.detect_sections() — heading matching → [{section_name, content, order}]
  ▼
chunker.chunk_sections()           — [{chunk_text, section_name, chunk_index, token_count}]
  ▼
embedding_service.embed_batch()    — list[list[float]] length 384 per chunk
  ▼
Supabase INSERT resume_sections, resume_chunks (with embedding)
  ▼
skill_extractor.extract_skills()   — [{skill_name, category, evidence}]
  ▼
Supabase UPSERT user_skills
  ▼
UPDATE resumes SET status='processed'
```

### Status Change Flow (Kanban Drag & Drop)

```
User drags card to new column
  → PATCH /api/v1/applications/{id}/status  { new_status }
  → change_application_status(user_id, application_id, new_status)  [service]
  → Supabase RPC: change_application_status(p_user_id, p_app_id, p_new_status)
  → PL/pgSQL function (SECURITY DEFINER):
      UPDATE applications SET status = p_new_status, updated_at = now()
      INSERT INTO application_history (application_id, status, changed_at)
      IF new_status = 'applied': SET applied_at = now()
```

---

## Database Schema (Authoritative Column Names)

All tables live in the `public` schema on Supabase. RLS is enabled on every table. The authoritative source is `supabase/migrations/20250525_001_initial_schema.sql`.

> **Note:** `Docs/present-state.md` previously contained incorrect column names for CV tables. The correct schema is documented below and matches the migration file and backend Pydantic models.

### Core

| Table | Key Columns | Notes |
|---|---|---|
| `profiles` | `id` (= auth.users.id), `email`, `full_name`, `avatar_url` | Auto-created on sign-up via trigger |
| `evaluation_tests` | `id`, `user_id`, `title`, `score`, `completed_at` | — |

### CV Intelligence

| Table | Key Columns | Notes |
|---|---|---|
| `resumes` | `id`, `user_id`, `file_name`, `file_type`, `file_url`, `raw_text`, `parsed_summary` (jsonb), `status`, `is_active`, `error_message` | Status: `uploaded\|processing\|processed\|failed` |
| `resume_sections` | `id`, `resume_id`, `user_id`, `section_name`, `section_order`, `content`, `metadata` (jsonb) | |
| `resume_chunks` | `id`, `resume_id`, `user_id`, `section_id`, `section_name`, `chunk_index`, `chunk_text`, `token_count`, `embedding vector(384)`, `metadata` (jsonb) | pgvector semantic search |
| `user_skills` | `id`, `user_id`, `resume_id`, `skill_name`, `category`, `proficiency`, `evidence`, `source` | Unique on `(user_id, skill_name)` |

### Job Intelligence

| Table | Key Columns | Notes |
|---|---|---|
| `job_searches` | `id`, `user_id`, `query`, `filters jsonb` | — |
| `jobs` | `id`, `title`, `company`, `location`, `description`, `requirements jsonb` | Readable by all authenticated users |
| `job_matches` | `id`, `user_id`, `job_id`, `match_score`, `skill_gaps jsonb` | — |

### Career Assistant

| Table | Key Columns | Notes |
|---|---|---|
| `applications` | `id`, `user_id`, `job_id?`, `manual_job_title`, `manual_company`, `status`, `notes`, `applied_at`, `deadline` | `job_id` OR `manual_job_title` required |
| `application_history` | `id`, `application_id`, `old_status`, `new_status`, `note`, `changed_at` | Written by RPC |
| `assistant_conversations` | `id`, `user_id`, `title`, `context jsonb` | — |
| `assistant_messages` | `id`, `conversation_id`, `role`, `content`, `metadata jsonb` | Role: `user/assistant/system` |
| `cover_letters` | `id`, `user_id`, `application_id?`, `title`, `content`, `version` | — |
| `roadmaps` | `id`, `user_id`, `title`, `description`, `target_role`, `duration_weeks` | — |
| `roadmap_items` | `id`, `roadmap_id`, `title`, `description`, `week_number`, `status` | — |
| `goals` | `id`, `user_id`, `title`, `description`, `target_date`, `status` | Status: `active/completed/paused/cancelled` |
| `tasks` | `id`, `user_id`, `goal_id?`, `title`, `due_date`, `status`, `priority` | Status: `todo/in_progress/done/cancelled` |
| `calendar_events` | `id`, `user_id`, `application_id?`, `title`, `event_type`, `scheduled_at` | Type: `deadline/interview/reminder/study/application/custom` |
| `skill_gap_analysis` | `id`, `user_id`, `target_role`, `current_skills jsonb`, `missing_skills jsonb` | — |

### Database Enums (from migration)

| Enum | Values |
|---|---|
| `resume_status` | `uploaded`, `processing`, `processed`, `failed` |
| `application_status` | `saved`, `applied`, `interviewing`, `offer`, `rejected` |
| `task_status` | `todo`, `in_progress`, `done`, `cancelled` |
| `goal_status` | `active`, `completed`, `paused`, `cancelled` |
| `message_role` | `user`, `assistant`, `system` |
| `event_type` | `deadline`, `interview`, `reminder`, `study`, `application`, `custom` |

---

## Environment Variables

Defined in root `.env` (used by Docker Compose for both services, gitignored):

| Variable | Used By | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Supabase anon/publishable key — safe for browser |
| `NEXT_PUBLIC_API_URL` | Frontend | Base URL for the FastAPI backend (e.g. `http://localhost:8000`) |
| `SUPABASE_URL` | Backend | Supabase project base URL (must **not** include `/rest/v1/`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Service role key — server-side only, never exposed to browser |
| `HF_TOKEN` | Backend / local dev | Hugging Face token for embedding model download (read-only token sufficient) |
| `ANTHROPIC_API_KEY` | Backend (future) | Claude API key for AI assistant features |
| `SUPABASE_DB_PASSWORD` | Supabase CLI | Used for `supabase db push` migrations |

See [`backend/.env.example`](../backend/.env.example) for a backend-only template.

---

## Migrations

| File | Description |
|---|---|
| `supabase/migrations/20250525_001_initial_schema.sql` | Full schema: all tables, enums, RLS policies, indexes, `updated_at` triggers, `handle_new_user` profile trigger |
| `supabase/migrations/20250525153000_kanban_manual_applications.sql` | Adds `manual_job_title`, `manual_company`, `manual_location` columns + check constraint + `change_application_status` PL/pgSQL RPC |

---

## What Is Not Yet Implemented

The following modules have complete database tables and Pydantic models but **no backend routes or frontend UI**:

- **Job Intelligence** — Job search, scraping/ingestion, match scoring
- **AI Career Assistant** — Chat interface, Claude API integration
- **Cover Letter Generator** — AI-generated cover letters from resume + job description
- **Roadmaps** — Career path planning with milestones
- **Goals & Tasks** — Personal goal tracking with task breakdown
- **Calendar** — Interview scheduling and deadline reminders
- **Skill Gap Analysis** — Identifying missing skills relative to target roles
- **CV Intelligence Frontend** — Upload UI, section viewer, skills display, semantic search UI (backend is complete)
