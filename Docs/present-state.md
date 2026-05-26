# CareerPilot — Present State

> Last updated: May 26, 2026

---

## Overview

CareerPilot is a hackathon career platform that helps users manage their job search lifecycle — from CV intelligence and job matching to application tracking and AI-assisted career planning. The project is a full-stack monorepo with a **Next.js 16 frontend**, a **FastAPI backend**, and **Supabase** as the auth + database layer.

Four vertical features are fully wired end-to-end today:

1. **Authentication** — Supabase email/password, cookie sessions, server-side route protection
2. **Kanban job application tracker** — full CRUD + drag-and-drop status changes at `/tracker`
3. **CV Intelligence** — PDF/DOCX upload, parse, chunk, embed, skill extraction, delete, semantic search at `/resume`
4. **AI-grounded CV answers** — RAG retrieval + Claude (`claude-3-haiku`) answers at `/resume` via `POST /answer`

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 | Turbopack in dev |
| Styling | Tailwind CSS v4 | |
| State / Data | TanStack React Query | |
| Notifications | Sonner | Toast system (top-right, auto-dismiss) |
| Drag & Drop | `@hello-pangea/dnd` | Kanban board |
| Auth (client) | `@supabase/ssr`, `@supabase/supabase-js` | Cookie-based sessions |
| Backend | FastAPI + Uvicorn, Python 3.11 | Global CORS-safe exception handlers |
| Validation | Pydantic v2, pydantic-settings | |
| Database | Supabase (PostgreSQL 15) | RLS on all tables |
| Vector search | pgvector — `vector(384)` on `resume_chunks` | IVFFlat index; RPC deployed via migration |
| CV Embeddings | `HashingVectorizer` (384-dim) **or** `sentence-transformers all-MiniLM-L6-v2` | Switchable via `EMBEDDING_BACKEND` env var |
| AI Answers | Anthropic Claude `claude-3-haiku-20240307` | Grounded in CV chunks; hallucination-prevention system prompt |
| CV Parsing | `pypdf` (PDF), `python-docx` (DOCX) | |
| Retrieval | pgvector RPC (`match_resume_chunks`) with numpy cosine fallback | Min similarity threshold 0.05 |
| Containers | Docker Compose | Backend :8000, Frontend :3000 |
| Migrations | Supabase CLI (`supabase db push`) | |

---

## Repository Structure

```
codesprint-2/
├── backend/
│   ├── main.py                 # FastAPI app, CORS, exception handlers, routers
│   ├── requirements.txt        # fastapi, supabase, pypdf, python-docx, scikit-learn, numpy, anthropic, sentence-transformers…
│   ├── Dockerfile
│   ├── .env.example
│   └── app/
│       ├── core/
│       │   ├── config.py            # settings: SUPABASE, ANTHROPIC_API_KEY, EMBEDDING_BACKEND
│       │   ├── auth.py
│       │   ├── database.py
│       │   ├── supabase_errors.py
│       │   └── enums.py
│       ├── career_assistant/        # Applications + Goals APIs (fully wired)
│       ├── cv_intelligence/
│       │   ├── models/              # Resume, ResumeSection, ResumeChunk, UserSkill
│       │   ├── routes/resumes.py    # 7 endpoints
│       │   └── services/
│       │       ├── resume_service.py      # orchestrator + delete
│       │       ├── resume_parser.py
│       │       ├── section_detector.py
│       │       ├── chunker.py
│       │       ├── embedding_service.py   # dual-backend (hashing/transformers)
│       │       ├── skill_extractor.py
│       │       ├── retrieval_service.py   # pgvector RPC + numpy fallback + min_similarity
│       │       ├── llm_service.py         # Anthropic Claude grounded answers
│       │       └── _helpers.py            # shared _rows()/_row() helpers
│       └── job_intelligence/        # Models only (no routes yet)
│   └── test/
│       └── CV-intelligence/         # 95 passed, 1 skipped
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── app/                     # /, /login, /resume, /tracker, /goals, /calendar
│       ├── components/nav/          # AppNav — sticky global navigation bar
│       ├── features/
│       │   ├── resume/              # CV upload, summary, AI answer, RAG UI
│       │   │   ├── api.ts           # upload, delete, query, askCvQuestion
│       │   │   ├── hooks.ts         # useUploadResume, useDeleteResume, useAskCvQuestion, useQueryResume
│       │   │   ├── types.ts         # Resume, ResumeDetail, CvAnswerRequest/Response
│       │   │   ├── resume-page-client.tsx
│       │   │   ├── resume-upload-card.tsx     # animated drop zone + processing strip
│       │   │   ├── resume-summary.tsx         # skeleton, expandable sections, skill chips, delete
│       │   │   ├── resume-answer-box.tsx      # AI answer panel + evidence cards
│       │   │   └── resume-query-box.tsx       # raw chunk search (dev/debug view)
│       │   ├── tracker/             # Kanban
│       │   └── goals/               # Goals + tasks
│       └── lib/                     # Supabase clients, api.ts fetch wrapper
├── supabase/
│   └── migrations/
├── Docs/
└── docker-compose.yml
```

---

## Feature Implementation Matrix

| Feature | Database | Backend Models | Backend API | Frontend UI |
|---|---|---|---|---|
| **Auth (Supabase)** | `profiles` + trigger | `profile.py` | — | Login + cookie sessions |
| **Kanban Tracker** | `applications`, history | `application.py` | Full CRUD + status RPC | `/tracker` drag-and-drop |
| **Application History** | `application_history` | `application_history.py` | In detail endpoint | Detail drawer timeline |
| **CV Upload / Parse / RAG** | `resumes`, `resume_sections`, `resume_chunks` | ✅ | 7 endpoints | `/resume` full UI |
| **User Skills (from CV)** | `user_skills` | `user_skill.py` | On upload + detail | Category-colored chips |
| **Delete Resume** | cascade | `resume_service.py` | `DELETE /{id}` | Confirm dialog |
| **AI-Grounded CV Answers** | — | `llm_service.py` | `POST /answer` | "Ask about your CV" + evidence |
| **pgvector RPC** | `match_resume_chunks` functions | — | Used in retrieval | — |
| **Global Navigation** | — | — | — | `AppNav` sticky topbar |
| Goals & Tasks | `goals`, `tasks` | ✅ | Full CRUD | `/goals` workspace |
| Calendar | `calendar_events` | ✅ | Supabase direct | `/calendar` view |
| Job Intelligence | `job_searches`, `jobs`, `job_matches` | ✅ | — | — |
| AI Career Assistant | `assistant_*` | ✅ | — | — |
| Cover Letter Gen | `cover_letters` | ✅ | — | — |
| Roadmaps | `roadmaps`, `roadmap_items` | ✅ | — | — |
| Skill Gap Analysis | `skill_gap_analysis` | ✅ | — | — |

---

## What Is Fully Implemented

### Authentication

- Email + password sign-up and sign-in via Supabase Auth.
- Sessions stored in HTTP-only cookies via `@supabase/ssr`.
- `/tracker`, `/resume`, `/goals` are server-side auth-gated (`redirect` to `/login?next=…`).
- `profiles` row auto-created via `handle_new_user()` trigger.

**Key files:** `frontend/src/app/login/`, `frontend/src/lib/supabase/`

---

### Global Navigation

Persistent sticky topbar (`AppNav`) appears on all authenticated pages linking Job Tracker, CV Intelligence, and Goals. Active route is highlighted.

**Key files:** `frontend/src/components/nav/AppNav.tsx`

---

### Kanban Application Tracker (`/tracker`)

Drag-and-drop Kanban for job applications.

**Statuses:** `saved` → `applied` → `interviewing` → `offer` → `rejected`

**Capabilities:** Add manual application, drag to change status (atomic RPC + history), detail drawer (edit, timeline, delete), optional `?status=` filter.

**API:** `GET/POST /api/v1/applications`, `GET/PATCH/DELETE /api/v1/applications/{id}`, `PATCH …/status`

---

### CV Intelligence (full-stack, full UX)

Upload a PDF or DOCX resume; the backend parses it into sections, chunks, embeddings, and skills. The frontend provides upload, overview, AI-grounded answers, and a raw chunk search view.

**Page:** http://localhost:3000/resume (auth required)

#### Frontend components (`src/features/resume/`)

| File | Role |
|---|---|
| `resume-page-client.tsx` | Layout, resume selector, status badge, sign-out |
| `resume-upload-card.tsx` | Animated drag-and-drop, file icon, size display, processing status strip |
| `resume-summary.tsx` | Skeleton loader, expandable section cards, category-colored skill chips, delete with confirm, retry button on failure |
| `resume-answer-box.tsx` | "Ask about your CV" — sample chips, AI answer display, collapsible evidence cards with similarity bars |
| `resume-query-box.tsx` | Raw semantic chunk search (dev/debug) |
| `api.ts` / `hooks.ts` / `types.ts` | Typed API + React Query + Sonner toasts |

#### Upload pipeline (`POST /api/v1/resumes/upload`)

```
validate_file (PDF/DOCX, ≤10 MB)
  → INSERT resumes (status=processing)
  → extract_text (pypdf / python-docx)
  → detect_sections (keyword headings → fallback "general")
  → INSERT resume_sections
  → chunk_sections (900 chars, 150 overlap)
  → embed_batch (HashingVectorizer 384-dim OR sentence-transformers)
  → INSERT resume_chunks (embedding vector(384))
  → extract_skills (50+ keywords, 6 categories)
  → UPSERT user_skills (on_conflict user_id,skill_name)
  → Deactivate other resumes (is_active=false)
  → UPDATE resumes (status=processed, raw_text, parsed_summary)
  → On failure: status=failed, error_message stored
```

#### AI Answer pipeline (`POST /api/v1/resumes/answer`)

```
embed question
  → search_chunks (pgvector RPC → numpy fallback, min_similarity=0.05)
  → Build context block from top-k chunks
  → Call Claude claude-3-haiku-20240307 with hallucination-prevention prompt
  → Return { answer, evidence_chunks[] }
```

#### API endpoints (`/api/v1/resumes`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Multipart upload → full pipeline |
| `GET` | `` | List user's resumes (newest first) |
| `GET` | `/{id}` | Detail: sections + skills + chunk_count |
| `GET` | `/{id}/chunks` | All chunks (no embeddings) |
| `POST` | `/query` | Raw semantic search → top-k chunks |
| `POST` | `/answer` | LLM-grounded answer + evidence chunks |
| `DELETE` | `/{id}` | Delete resume (cascade sections/chunks/skills) |

#### Retrieval strategy

1. Try Supabase RPC `match_resume_chunks` / `match_resume_chunks_with_resume` (IVFFlat + `ivfflat.probes=10`)
2. On RPC failure → numpy cosine over fetched chunks (Python fallback)
3. Both paths filter `similarity < 0.05`

**Unit tests:** 95 passed, 1 skipped.

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
  → React Query invalidates list + detail → Sonner toast.success
```

### AI Answer Flow

```
/resume → useAskCvQuestion({ question, resume_id })
  → POST /api/v1/resumes/answer
  → retrieval_service.search_chunks() → top-k evidence
  → llm_service.answer_from_chunks() → Claude API
  → { answer, evidence_chunks } → ResumeAnswerBox renders answer + collapsible evidence
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

---

## Migrations

| File | Description |
|---|---|
| `20250525_001_initial_schema.sql` | Full schema, RLS, pgvector, `handle_new_user` |
| `20250525153000_kanban_manual_applications.sql` | Manual job fields + `change_application_status` RPC |
| `20250525170000_goals_tasks_priority.sql` | Goals/tasks priority constraints |
| `20250526001000_goals_tasks_grants.sql` | Table grants for goals/tasks |
| `20250526003000_calendar_grants.sql` | Table grants for calendar |
| `20250526120000_resume_cv_grants.sql` | Table grants for CV tables (fixes SQLSTATE `42501`) |
| `20250526130000_pgvector_rpc.sql` | `match_resume_chunks` + `match_resume_chunks_with_resume` functions |

---

## Environment Variables

| Variable | Used by | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Anon key (browser-safe) |
| `NEXT_PUBLIC_API_URL` | Frontend | FastAPI base (e.g. `http://localhost:8000`) |
| `SUPABASE_URL` | Backend | Bare project URL (**no** `/rest/v1/` suffix) |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Service role — server only |
| `ANTHROPIC_API_KEY` | Backend | Claude API key — required for `/answer` |
| `EMBEDDING_BACKEND` | Backend | `hashing` (default) or `transformers` (semantic) |
| `SUPABASE_DB_PASSWORD` | Supabase CLI | For `db push` |

---

## What Is Not Yet Implemented

- **Job Intelligence** — search, ingestion, match scoring (models only)
- **AI Career Assistant** — multi-turn chat, conversation history
- **Cover letters, roadmaps, skill gap analysis** — schema + models only
- **Supabase Storage** for raw CV files (`file_url` column exists but upload does not store the file blob)
- **Proficiency inference** for skills (skill list is static ~50 keywords)
- **OCR for scanned PDFs** — out of scope; image-only PDFs return 422

---

## Related Docs

| Document | Purpose |
|---|---|
| [`cv-intelligence-implementation.md`](cv-intelligence-implementation.md) | Full CV Intelligence design and code map |
| [`cv-intelligence-notes-and-fixes.md`](cv-intelligence-notes-and-fixes.md) | Grants, CORS, embeddings, pgvector, debugging |
| [`db-design-initial.md`](db-design-initial.md) | Original schema design reference |
