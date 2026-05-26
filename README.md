# CareerPilot

A hackathon-grade career platform that helps users manage their entire job search lifecycle — CV intelligence, job matching, application tracking, and AI-assisted career planning.

Built as a full-stack monorepo with **Next.js 16**, **FastAPI**, and **Supabase**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5, Turbopack |
| Styling | Tailwind CSS v4 |
| State / Data | TanStack React Query |
| Drag & Drop | `@hello-pangea/dnd` |
| Auth (client) | `@supabase/ssr`, `@supabase/supabase-js` (cookie-based sessions) |
| Backend | FastAPI + Uvicorn, Python 3.11 |
| Validation | Pydantic v2, pydantic-settings |
| Database | Supabase (PostgreSQL 15) with RLS on all tables |
| Vector Search | pgvector (`vector(384)` on `resume_chunks`) |
| CV Embeddings | scikit-learn `HashingVectorizer` (384-dim, no model download) |
| CV Parsing | `pypdf`, `python-docx` |
| Containers | Docker Compose |
| Migrations | Supabase CLI (`supabase db push`) |

---

## Repository Structure

```
codesprint-2/
├── backend/                    # FastAPI application
│   ├── main.py
│   ├── requirements.txt
│   └── app/
│       ├── core/               # Config, auth, supabase_errors, database
│       ├── career_assistant/   # Applications API (Kanban)
│       ├── cv_intelligence/    # Resume upload, parse, embed, RAG
│       └── job_intelligence/   # Models only (no routes yet)
│   └── test/CV-intelligence/   # Unit tests (95 passed, 1 skipped)
├── frontend/
│   └── src/
│       ├── app/                # /tracker, /resume, /login
│       ├── features/tracker/   # Kanban board
│       └── features/resume/    # CV upload + RAG UI
├── supabase/migrations/
├── Docs/
│   ├── present-state.md
│   ├── cv-intelligence-implementation.md
│   ├── cv-intelligence-notes-and-fixes.md
│   └── db-design-initial.md
├── docker-compose.yml
└── .env                        # Shared env (gitignored)
```

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with Compose v2)
- [Node.js 20+](https://nodejs.org/) (optional — for local frontend without Docker)
- [Python 3.11+](https://www.python.org/) (optional — for local backend without Docker)
- A [Supabase](https://supabase.com/) project with **all migrations** applied (including CV grants)

---

## Running the Project

### Option A — Docker Compose (recommended)

```bash
# From the repo root
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| API docs | http://localhost:8000/docs |

Changes to `backend/` and `frontend/src/` are hot-reloaded inside the containers.

### Option B — Run locally (without Docker)

**Backend**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Copy env vars from the repo root `.env` (see [Environment Variables](#environment-variables)).

---

## Database Migrations

Apply all migrations to your Supabase project:

```bash
npm install   # Supabase CLI in root package.json

npx supabase db push --db-url "postgresql://postgres:<SUPABASE_DB_PASSWORD>@db.<project-ref>.supabase.co:5432/postgres"
```

| File | Description |
|---|---|
| `20250525_001_initial_schema.sql` | Full schema, RLS, pgvector, triggers |
| `20250525153000_kanban_manual_applications.sql` | Manual job fields + status-change RPC |
| `20250526120000_resume_cv_grants.sql` | **Required for CV upload** — table grants for service_role |

> If resume upload returns `permission denied for table resumes`, you are missing the grants migration. See [`Docs/cv-intelligence-notes-and-fixes.md`](Docs/cv-intelligence-notes-and-fixes.md).

---

## Testing the Present State

Three features are live: **auth**, **Kanban tracker**, and **CV Intelligence**.

### 1 — Start the stack

```bash
docker compose up --build
```

### 2 — Create an account

1. Open http://localhost:3000 → redirect to `/login`
2. Sign up with email + password
3. A `profiles` row is created automatically

### 3 — Kanban tracker (`/tracker`)

| Action | How |
|---|---|
| Add application | **Add Application** → fill title, company, etc. |
| Change status | Drag card between columns |
| View / edit / delete | Click card → detail drawer |
| Filter | `?status=applied` (or other valid status) |

**Statuses:** `saved` → `applied` → `interviewing` → `offer` → `rejected`

### 4 — CV Intelligence (`/resume`)

1. Go to http://localhost:3000/resume (login required)
2. Upload a **text-based** PDF or DOCX (max 10 MB)
3. View extracted **sections**, **skills**, and **chunk count**
4. Use **RAG search test** after status is `processed`

| UI area | What it does |
|---|---|
| Upload CV | Drag-and-drop → full backend pipeline |
| Resume overview | Sections, skill chips, processing/failed states |
| RAG search test | Semantic query over your chunks (top 5) |

### 5 — API smoke tests

Interactive docs: http://localhost:8000/docs

**Applications**

```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8000/api/v1/applications
```

**Resume upload (PowerShell)**

```powershell
$token = "your_supabase_access_token"
curl.exe -X POST "http://localhost:8000/api/v1/resumes/upload" `
  -H "Authorization: Bearer $token" `
  -F "file=@E:\path\to\resume.pdf"
```

**Semantic query**

```powershell
curl.exe -X POST "http://localhost:8000/api/v1/resumes/query" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{\"query\": \"Python FastAPI\", \"top_k\": 5}'
```

Get a Bearer token: DevTools → Application → Supabase auth cookie, or `supabase.auth.getSession()` in the browser console.

### 6 — Unit tests (CV pipeline)

```bash
cd backend
python -m pytest test/CV-intelligence/ -v
```

No network or model download required (HashingVectorizer).

---

## Environment Variables

Copy the repo root `.env` (gitignored). Docker Compose loads it for both services.

| Variable | Used by | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Anon key |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend URL (e.g. `http://localhost:8000`) |
| `SUPABASE_URL` | Backend | Bare project URL — **no** `/rest/v1/` suffix |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Service role key (server only) |
| `ANTHROPIC_API_KEY` | Backend | Claude (future assistant features) |
| `HF_TOKEN` | Optional | Legacy; not needed for current embeddings |

See [`backend/.env.example`](backend/.env.example).

---

## Feature Implementation Status

| Feature | Database | Backend API | Frontend UI |
|---|---|---|---|
| **Auth** | ✅ | — | ✅ Login + sessions |
| **Kanban Tracker** | ✅ | ✅ | ✅ `/tracker` |
| **CV Intelligence** | ✅ | ✅ | ✅ `/resume` |
| Job Search / Matching | ✅ models | — | — |
| AI Assistant / Cover letters / Roadmaps / Goals | ✅ models | — | — |

---

## Docs

| Document | Description |
|---|---|
| [`Docs/present-state.md`](Docs/present-state.md) | What is implemented today, flows, schema summary |
| [`Docs/cv-intelligence-implementation.md`](Docs/cv-intelligence-implementation.md) | Full CV module architecture and API reference |
| [`Docs/cv-intelligence-notes-and-fixes.md`](Docs/cv-intelligence-notes-and-fixes.md) | Grants, CORS, embeddings pivot, troubleshooting |
| [`Docs/db-design-initial.md`](Docs/db-design-initial.md) | Original database design (~1 400 lines) |

---

## Known Issues

- `SUPABASE_URL` must be the bare project URL (not `…/rest/v1/`).
- Apply `20250526120000_resume_cv_grants.sql` before testing CV upload against Supabase.
- pgvector RPC functions are not migrated yet; retrieval uses a Python/numpy fallback.
- Home (`/`) redirects to `/tracker`; navigate to `/resume` manually for CV Intelligence.
- Hot reload in Docker on Windows uses polling (`WATCHPACK_POLLING=true` in `docker-compose.yml`).
