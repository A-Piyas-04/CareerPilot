# CareerPilot — Present State

> Last updated: May 26, 2026

---

## Overview

CareerPilot is a hackathon career platform that helps users manage their job search lifecycle — from CV intelligence and job matching to application tracking and AI-assisted career planning. The project is a full-stack monorepo with a **Next.js 16 frontend**, a **FastAPI backend**, and **Supabase** as the auth + database layer.

Three vertical features are wired end-to-end today:

1. **Authentication** — Supabase email/password, cookie sessions, server-side route protection
2. **Kanban job application tracker** — full CRUD + drag-and-drop status changes at `/tracker`
3. **CV Intelligence** — PDF/DOCX upload, parse, chunk, embed, skill extraction, semantic search at `/resume` (frontend + backend)

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 | Turbopack in dev |
| Styling | Tailwind CSS v4 | |
| State / Data | TanStack React Query | |
| Drag & Drop | `@hello-pangea/dnd` | Kanban board |
| Auth (client) | `@supabase/ssr`, `@supabase/supabase-js` | Cookie-based sessions |
| Backend | FastAPI + Uvicorn, Python 3.11 | Global CORS-safe exception handlers |
| Validation | Pydantic v2, pydantic-settings | |
| Database | Supabase (PostgreSQL 15) | RLS on all tables |
| Vector search | pgvector — `vector(384)` on `resume_chunks` | IVFFlat index; RPC optional |
| CV Embeddings | scikit-learn `HashingVectorizer` (384-dim, L2-normalized) | No model download; deterministic |
| CV Parsing | `pypdf` (PDF), `python-docx` (DOCX) | |
| Retrieval fallback | `numpy` cosine similarity in Python | When pgvector RPC is unavailable |
| Containers | Docker Compose | Backend :8000, Frontend :3000 |
| Migrations | Supabase CLI (`supabase db push`) | |

---

## Repository Structure

```
codesprint-2/
├── backend/
│   ├── main.py                 # FastAPI app, CORS, exception handlers, routers
│   ├── requirements.txt        # fastapi, supabase, pypdf, python-docx, scikit-learn, numpy…
│   ├── Dockerfile
│   ├── .env.example
│   └── app/
│       ├── core/
│       │   ├── config.py
│       │   ├── auth.py
│       │   ├── database.py
│       │   ├── supabase_errors.py   # PostgREST → HTTP mapping (incl. 42501 grants hint)
│       │   └── enums.py
│       ├── career_assistant/   # Applications API (fully wired)
│       ├── cv_intelligence/
│       │   ├── models/         # Resume, ResumeSection, ResumeChunk, UserSkill
│       │   ├── routes/resumes.py
│       │   └── services/
│       │       ├── resume_service.py
│       │       ├── resume_parser.py
│       │       ├── section_detector.py
│       │       ├── chunker.py
│       │       ├── embedding_service.py
│       │       ├── skill_extractor.py
│       │       └── retrieval_service.py
│       └── job_intelligence/   # Models only (no routes yet)
│   └── test/
│       └── CV-intelligence/    # 96 tests (95 passed, 1 skipped)
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── app/                # root → /tracker, /login, /tracker, /resume
│       ├── features/
│       │   ├── tracker/        # Kanban
│       │   └── resume/         # CV upload, summary, RAG query UI
│       └── lib/                # Supabase clients, api.ts fetch wrapper
├── supabase/
│   ├── config.toml
│   └── migrations/
├── Docs/
│   ├── db-design-initial.md
│   ├── present-state.md        # This file
│   ├── cv-intelligence-implementation.md
│   └── cv-intelligence-notes-and-fixes.md
├── docker-compose.yml
├── .env                        # Shared (gitignored)
└── package.json                # Root: Supabase CLI
```

---

## Feature Implementation Matrix

| Feature | Database | Backend Models | Backend API | Frontend UI |
|---|---|---|---|---|
| **Auth (Supabase)** | `profiles` + trigger | `profile.py` | — | ✅ Login + session cookies |
| **Kanban Tracker** | `applications` + RPC | `application.py` | ✅ Full CRUD + status | ✅ `/tracker` |
| **Application History** | `application_history` | `application_history.py` | ✅ In detail endpoint | ✅ Detail drawer timeline |
| **CV Upload / Parse / RAG** | `resumes`, `resume_sections`, `resume_chunks` | ✅ | ✅ 5 endpoints | ✅ `/resume` |
| **User Skills (from CV)** | `user_skills` | `user_skill.py` | ✅ On upload | ✅ Skill chips in summary |
| Job Search | `job_searches`, `jobs` | ✅ | — | — |
| Job Matching | `job_matches` | ✅ | — | — |
| AI Chat / Assistant | `assistant_*` | ✅ | — | — |
| Cover Letter Gen | `cover_letters` | ✅ | — | — |
| Roadmaps | `roadmaps`, `roadmap_items` | ✅ | — | — |
| Goals & Tasks | `goals`, `tasks` | ✅ | — | — |
| Calendar Events | `calendar_events` | ✅ | — | — |
| Skill Gap Analysis | `skill_gap_analysis` | ✅ | — | — |

---

## What Is Fully Implemented

### Authentication

- Email + password sign-up and sign-in via Supabase Auth.
- Sessions stored in HTTP-only cookies via `@supabase/ssr`.
- `/tracker` and `/resume` are server-side auth-gated (`redirect` to `/login?next=…`).
- `profiles` row auto-created via `handle_new_user()` trigger.

**Key files:** `frontend/src/app/login/`, `frontend/src/lib/supabase/`

---

### Kanban Application Tracker (`/tracker`)

Drag-and-drop Kanban for job applications.

**Statuses (DB enum + frontend):** `saved` → `applied` → `interviewing` → `offer` → `rejected`

**Capabilities:** add manual application, drag to change status (atomic RPC + history), detail drawer (edit, timeline, delete), optional `?status=` filter, sign out.

**API:** `GET/POST /api/v1/applications`, `GET/PATCH/DELETE /api/v1/applications/{id}`, `PATCH …/status`

**Backend:** `career_assistant/routes/applications.py`, `career_assistant/services/applications.py`

---

### CV Intelligence (full-stack)

Upload a PDF or DOCX resume; the backend parses it into sections, chunks, embeddings, and skills. The frontend exposes upload, overview, and a RAG search tester.

**Page:** http://localhost:3000/resume (auth required)

**Frontend (`src/features/resume/`):**

| File | Role |
|---|---|
| `resume-page-client.tsx` | Layout, resume selector, status badge |
| `resume-upload-card.tsx` | Drag-and-drop upload |
| `resume-summary.tsx` | Sections, skills, chunk count, errors |
| `resume-query-box.tsx` | Semantic search over chunks |
| `api.ts` / `hooks.ts` / `types.ts` | Typed API + React Query |

**Upload pipeline (`POST /api/v1/resumes/upload`):**

```
Validate file (PDF/DOCX, ≤10 MB)
  → INSERT resumes (status=processing)
  → extract_text (pypdf / python-docx)
  → detect_sections (keyword headings → fallback "general")
  → INSERT resume_sections
  → chunk_sections (900 chars, 150 overlap)
  → embed_batch (HashingVectorizer, 384-dim)
  → INSERT resume_chunks (embedding vector(384))
  → extract_skills (50+ keywords, 6 categories)
  → UPSERT user_skills (on_conflict user_id,skill_name)
  → Deactivate other resumes (is_active=false)
  → UPDATE resumes (status=processed, raw_text, parsed_summary)
  → On failure: status=failed, error_message stored
```

**API (`/api/v1/resumes`):**

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Multipart upload → full pipeline |
| `GET` | `` | List user's resumes (newest first) |
| `GET` | `/{resume_id}` | Detail + sections + skills + chunk_count |
| `GET` | `/{resume_id}/chunks` | All chunks (no embeddings in list select) |
| `POST` | `/query` | Semantic search (`query`, optional `resume_id`, `top_k`) |

**Retrieval:** Tries Supabase RPC `match_resume_chunks` / `match_resume_chunks_with_resume` first; falls back to numpy cosine over fetched chunks. **Note:** RPC functions are not in migrations yet — production path today is the Python fallback.

**Embeddings:** `sklearn.feature_extraction.text.HashingVectorizer(n_features=384, alternate_sign=False, norm="l2")` — no Hugging Face download, fast Docker builds.

See [`cv-intelligence-implementation.md`](cv-intelligence-implementation.md) for full technical detail and [`cv-intelligence-notes-and-fixes.md`](cv-intelligence-notes-and-fixes.md) for operational fixes.

**Unit tests:** 96 collected — **95 passed, 1 skipped** (`test_resume_parser` PDF round-trip when `reportlab` absent).

```bash
cd backend
python -m pytest test/CV-intelligence/ -v
```

---

## How Things Are Connected

### Request Flow (Authenticated API)

```
Browser → Supabase Auth (JWT in session cookie)
  → Next.js page (getUser() gate)
  → Client: apiRequest() with Authorization: Bearer <access_token>
  → FastAPI get_current_user() → supabase.auth.get_user/get_claims
  → Service layer → supabase (service role) → Postgres
  → Ownership: .eq("user_id", user_id) on every query
```

### CV Upload Flow

```
/resume → uploadResume(FormData) → POST /api/v1/resumes/upload
  → resume_service.process_resume()
  → parser → section_detector → chunker → embedding_service → Supabase inserts
  → skill_extractor → user_skills upsert → resume marked processed
  → React Query invalidates list + detail
```

### Status Change Flow (Kanban)

```
Drag card → PATCH /applications/{id}/status
  → RPC change_application_status (SECURITY DEFINER)
  → UPDATE applications + INSERT application_history
```

---

## Database Schema (CV tables)

Authoritative source: `supabase/migrations/20250525_001_initial_schema.sql`

| Table | Key columns |
|---|---|
| `resumes` | `file_name`, `file_type`, `raw_text`, `parsed_summary` jsonb, `status`, `is_active`, `error_message` |
| `resume_sections` | `section_name`, `section_order`, `content`, `metadata` |
| `resume_chunks` | `chunk_index`, `chunk_text`, `token_count`, `embedding vector(384)` |
| `user_skills` | `skill_name`, `category`, `evidence`, `source`; unique `(user_id, skill_name)` |

**Extra migration:** `20250526120000_resume_cv_grants.sql` — `GRANT` on CV tables to `authenticated` and `service_role` (fixes SQLSTATE `42501` from backend).

---

## Environment Variables

| Variable | Used by | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Anon key (browser-safe) |
| `NEXT_PUBLIC_API_URL` | Frontend | FastAPI base (e.g. `http://localhost:8000`) |
| `SUPABASE_URL` | Backend | Bare project URL (**no** `/rest/v1/` suffix) |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Service role — server only |
| `ANTHROPIC_API_KEY` | Backend (future) | Claude assistant |
| `HF_TOKEN` | Optional | Legacy; not required after HashingVectorizer switch |
| `SUPABASE_DB_PASSWORD` | Supabase CLI | For `db push` |

---

## Migrations

| File | Description |
|---|---|
| `20250525_001_initial_schema.sql` | Full schema, RLS, pgvector, `handle_new_user` |
| `20250525153000_kanban_manual_applications.sql` | Manual job fields + `change_application_status` RPC |
| `20250526120000_resume_cv_grants.sql` | Table grants for CV Intelligence PostgREST access |

---

## What Is Not Yet Implemented

- **Job Intelligence** — search, ingestion, match scoring (models only)
- **AI Career Assistant** — chat, Claude integration
- **Cover letters, roadmaps, goals, calendar, skill gap** — schema + models only
- **pgvector RPC functions** — `match_resume_chunks` referenced in code but not migrated
- **Supabase Storage** for raw CV files (`file_url` column exists but upload does not persist file blob yet)
- **Cross-page navigation** — home redirects to `/tracker`; no global nav linking `/resume`

---

## Related Docs

| Document | Purpose |
|---|---|
| [`cv-intelligence-implementation.md`](cv-intelligence-implementation.md) | Full CV Intelligence design and code map |
| [`cv-intelligence-notes-and-fixes.md`](cv-intelligence-notes-and-fixes.md) | Grants, CORS, embeddings pivot, debugging |
| [`db-design-initial.md`](db-design-initial.md) | Original schema design reference |
