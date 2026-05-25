# CareerPilot — Present State

> Last updated: May 26, 2026

---

## Overview

CareerPilot is a hackathon career platform that helps users manage their job search lifecycle — from CV intelligence and job matching to application tracking and AI-assisted career planning. The project is a full-stack monorepo with a **Next.js 16 frontend**, a **FastAPI backend**, and **Supabase** as the auth + database layer.

The entire database schema and all backend Pydantic models have been defined across three feature modules. As of today, **one complete vertical feature is wired end-to-end**: the **Kanban job application tracker**.

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
| Vector search | pgvector (extension enabled) | For future CV/RAG features |
| Containers | Docker Compose | Backend :8000, Frontend :3000 |
| Migrations | Supabase CLI (`supabase db push`) | |

---

## Repository Structure

```
codesprint-2/
├── backend/                    # FastAPI application
│   ├── main.py                 # App entry point, CORS, router registration
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   └── app/
│       ├── core/               # Config, auth, database clients, enums, base models
│       ├── career_assistant/   # Models, routes, services (applications only wired)
│       ├── cv_intelligence/    # Models only (no routes yet)
│       └── job_intelligence/   # Models only (no routes yet)
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
├── .env                        # Shared env (used by Docker Compose)
└── package.json                # Root: Supabase CLI dependency only
```

---

## Feature Implementation Matrix

| Feature | Database | Backend Models | Backend API | Frontend UI |
|---|---|---|---|---|
| **Auth (Supabase)** | `profiles` + trigger | `profile.py` | — | Login page + session cookies |
| **Kanban Tracker** | `applications` + RPC | `application.py` | **Full CRUD + status** | **Full Kanban board** |
| **Application History** | `application_history` | `application_history.py` | Included in detail endpoint | Detail drawer timeline |
| CV Upload / Parse | `resumes`, `resume_sections`, `resume_chunks` | `resume.py`, `resume_section.py`, `resume_chunk.py` | — | — |
| User Skills | `user_skills` | `user_skill.py` | — | — |
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

## How Things Are Connected

### Request Flow (Authenticated API Call)

```
Browser
  │
  │  1. User signs in at /login
  ▼
Supabase Auth ──► Issues access_token (JWT), stored as session cookie
  │
  │  2. User visits /tracker
  ▼
Next.js Server (tracker/page.tsx)
  │  supabase.auth.getUser()  →  redirect to /login if no session
  ▼
TrackerBoard (client component)
  │  React Query → api.ts → fetch(NEXT_PUBLIC_API_URL + "/api/v1/applications")
  │  Authorization: Bearer <access_token>
  ▼
FastAPI Backend
  │  get_current_user() dependency → supabase.auth.get_user(token) → user_id
  │  ApplicationsService → supabase (service role) → Postgres
  ▼
Supabase Postgres
  (service role bypasses RLS; ownership enforced by eq("user_id", user_id) in queries)
```

### Status Change Flow (Drag & Drop)

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

## Database Schema (Implemented Tables)

All tables live in the `public` schema on Supabase. RLS is enabled on every table.

### Core

| Table | Key Columns | Notes |
|---|---|---|
| `profiles` | `id` (= auth.users.id), `email`, `full_name`, `avatar_url` | Auto-created on sign-up via trigger |
| `evaluation_tests` | `id`, `user_id`, `title`, `score`, `completed_at` | — |

### CV Intelligence

| Table | Key Columns | Notes |
|---|---|---|
| `resumes` | `id`, `user_id`, `title`, `status`, `is_primary` | Status enum: `draft/active/archived` |
| `resume_sections` | `id`, `resume_id`, `section_type`, `content`, `order_index` | — |
| `resume_chunks` | `id`, `resume_id`, `content`, `embedding vector(384)` | pgvector for semantic search |
| `user_skills` | `id`, `user_id`, `skill_name`, `proficiency_level`, `years_exp` | — |

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
| `application_history` | `id`, `application_id`, `status`, `changed_at`, `notes` | Written by RPC |
| `assistant_conversations` | `id`, `user_id`, `title`, `context jsonb` | — |
| `assistant_messages` | `id`, `conversation_id`, `role`, `content`, `metadata jsonb` | Role enum: `user/assistant/system` |
| `cover_letters` | `id`, `user_id`, `application_id?`, `title`, `content`, `version` | — |
| `roadmaps` | `id`, `user_id`, `title`, `description`, `target_role`, `duration_weeks` | — |
| `roadmap_items` | `id`, `roadmap_id`, `title`, `description`, `week_number`, `status` | — |
| `goals` | `id`, `user_id`, `title`, `description`, `target_date`, `status` | Status enum: `active/completed/paused/abandoned` |
| `tasks` | `id`, `user_id`, `goal_id?`, `title`, `due_date`, `status`, `priority` | Status enum: `todo/in_progress/done/cancelled` |
| `calendar_events` | `id`, `user_id`, `application_id?`, `title`, `event_type`, `scheduled_at` | Type enum: `interview/deadline/followup/reminder/other` |
| `skill_gap_analysis` | `id`, `user_id`, `target_role`, `current_skills jsonb`, `missing_skills jsonb` | — |

### Database Enums

| Enum | Values |
|---|---|
| `application_status` | `saved`, `applied`, `screening`, `interviewing`, `offered`, `accepted`, `rejected`, `withdrawn` |
| `resume_status` | `draft`, `active`, `archived` |
| `task_status` | `todo`, `in_progress`, `done`, `cancelled` |
| `goal_status` | `active`, `completed`, `paused`, `abandoned` |
| `message_role` | `user`, `assistant`, `system` |
| `event_type` | `interview`, `deadline`, `followup`, `reminder`, `other` |

---

## Environment Variables

Defined in root `.env` (used by Docker Compose for both services):

| Variable | Used By | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Supabase project URL (e.g. `https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Supabase anon/publishable key — safe for browser |
| `NEXT_PUBLIC_API_URL` | Frontend | Base URL for the FastAPI backend (e.g. `http://localhost:8000`) |
| `SUPABASE_URL` | Backend | Supabase project base URL (must **not** include `/rest/v1/`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Service role key — server-side only, never exposed to browser |
| `ANTHROPIC_API_KEY` | Backend (future) | Claude API key — referenced in config, not yet used in code |
| `SUPABASE_DB_PASSWORD` | Supabase CLI | Used for `supabase db push` migrations |

> **Known issue:** The current root `.env` has `SUPABASE_URL` set with a `/rest/v1/` suffix. The Python `supabase-py` client expects the bare project URL (`https://<ref>.supabase.co`). This should be corrected before deploying or running the backend standalone.

---

## What Is Not Yet Implemented

The following modules have complete database tables and Pydantic models but **no backend routes or frontend UI**:

- **CV Intelligence** — Resume upload, parsing, chunking, vector embedding, skill extraction
- **Job Intelligence** — Job search, scraping/ingestion, match scoring
- **AI Career Assistant** — Chat interface, Claude API integration
- **Cover Letter Generator** — AI-generated cover letters from resume + job
- **Roadmaps** — Career path planning with milestones
- **Goals & Tasks** — Personal goal tracking with task breakdown
- **Calendar** — Interview scheduling and deadline reminders
- **Skill Gap Analysis** — Identifying missing skills relative to target roles

---

## Migrations

| File | Description |
|---|---|
| `supabase/migrations/20250525_001_initial_schema.sql` | Full schema: all tables, enums, RLS policies, indexes, `updated_at` triggers, `handle_new_user` profile trigger |
| `supabase/migrations/20250525153000_kanban_manual_applications.sql` | Adds `manual_job_title`, `manual_company`, `manual_location` columns + check constraint + `change_application_status` PL/pgSQL RPC |
