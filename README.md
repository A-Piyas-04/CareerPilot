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
| Vector Search | pgvector (`vector(384)` on `resume_chunks`, cosine similarity retrieval) |
| CV Embeddings | `sentence-transformers/all-MiniLM-L6-v2` (384-dim) |
| CV Parsing | `pypdf`, `python-docx` |
| Containers | Docker Compose |
| Migrations | Supabase CLI (`supabase db push`) |

---

## Repository Structure

```
codesprint-2/
├── backend/                    # FastAPI application
│   ├── main.py                 # App entry point, CORS, router registration
│   ├── requirements.txt
│   ├── Dockerfile
│   └── app/
│       ├── core/               # Config, auth, database clients, enums, base models
│       ├── career_assistant/   # Models, routes, services (applications fully wired)
│       ├── cv_intelligence/    # CV upload, parse, chunk, embed, retrieve (backend API)
│       │   ├── routes/resumes.py
│       │   └── services/         # parser, section_detector, chunker, embeddings, skills, retrieval
│       └── job_intelligence/   # Models only (no routes yet)
│   └── test/
│       └── CV-intelligence/    # Unit tests for CV pipeline services
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
│   └── present-state.md        # Detailed present state of the project
├── docker-compose.yml
├── .env                        # Shared env (used by Docker Compose)
└── package.json                # Root: Supabase CLI dependency only
```

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with Compose v2)
- [Node.js 20+](https://nodejs.org/) (only needed if running outside Docker)
- [Python 3.11+](https://www.python.org/) (only needed if running outside Docker)
- A [Supabase](https://supabase.com/) project with the migrations applied

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
| Backend API docs | http://localhost:8000/docs |

Changes to `backend/` and `frontend/src/` are hot-reloaded inside the containers.

### Option B — Run Services Locally (without Docker)

**Backend**

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**First-time CV embedding setup:** The backend downloads `sentence-transformers/all-MiniLM-L6-v2` (~90 MB) on first upload or test run. Set `HF_TOKEN` in the repo root `.env` for faster, authenticated downloads from Hugging Face:

```bash
# Pre-download the model (optional but recommended before first upload)
cd backend
# Windows PowerShell — token is loaded from ../.env when using Docker; for local runs:
$env:HF_TOKEN = "<your-huggingface-token>"
python -c "from huggingface_hub import snapshot_download; snapshot_download('sentence-transformers/all-MiniLM-L6-v2')"
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

---

## Database Migrations

Apply all migrations to your remote Supabase project:

```bash
# Install Supabase CLI (once)
npm install   # installs supabase CLI listed in root package.json

# Push migrations
npx supabase db push --db-url "postgresql://postgres:<SUPABASE_DB_PASSWORD>@db.<project-ref>.supabase.co:5432/postgres"
```

Migrations in `supabase/migrations/`:

| File | Description |
|---|---|
| `20250525_001_initial_schema.sql` | All tables, enums, RLS policies, indexes, `updated_at` triggers, `handle_new_user` profile trigger |
| `20250525153000_kanban_manual_applications.sql` | Adds `manual_job_title`, `manual_company`, `manual_location` columns + `change_application_status` PL/pgSQL RPC |

---

## Testing the Present State

Two vertical features are fully implemented on the backend: the **Kanban job application tracker** (full-stack) and the **CV Intelligence pipeline** (backend API + unit tests). Below is a step-by-step walkthrough for both.

### 1 — Start the stack

```bash
docker compose up --build
```

Wait until both containers are healthy (you should see Uvicorn and Next.js startup logs).

### 2 — Create an account

1. Open http://localhost:3000
2. You will be redirected to http://localhost:3000/login
3. Click **Sign Up**, enter an email and password, then submit.
4. A `profiles` row is automatically created via the `handle_new_user` database trigger.

### 3 — Verify the backend is reachable

Open the interactive API docs at http://localhost:8000/docs.

You should see routes under **`/api/v1/applications`** (Kanban) and **`/api/v1/resumes`** (CV Intelligence).

### 4 — Use the Kanban board

Navigate to http://localhost:3000/tracker (you will be redirected to login first if not authenticated).

| Action | How to test |
|---|---|
| **Add an application** | Click **"Add Application"** → fill in Job Title, Company, Location (optional), Notes, Deadline → Submit. The card appears in the **Saved** column. |
| **Move a card** | Drag a card from one column to another. The status change is written atomically via the `change_application_status` DB RPC and a history entry is recorded. |
| **View application detail** | Click any card. A slide-in drawer opens showing all fields and a full status history timeline. |
| **Edit fields** | Inside the detail drawer, modify notes or deadline and save. |
| **Delete an application** | Open the detail drawer and click **Delete**. |
| **Filter by status** | Append `?status=applied` (or any valid status) to the tracker URL. |
| **Sign out** | Click the Sign Out button in the board header. |

### 5 — Verify status history via the API

After dragging a card, call the detail endpoint directly to confirm history is recorded:

```bash
# Replace TOKEN and APPLICATION_ID with real values
curl -H "Authorization: Bearer <TOKEN>" \
     http://localhost:8000/api/v1/applications/<APPLICATION_ID>
```

The response includes a `history` array with a `changed_at` timestamp for each status transition.

### 6 — Backend API smoke tests

```bash
# List all applications for the authenticated user
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8000/api/v1/applications

# Create a new application
curl -X POST http://localhost:8000/api/v1/applications \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"manual_job_title": "Backend Engineer", "manual_company": "Acme Corp", "status": "saved"}'

# Change status
curl -X PATCH http://localhost:8000/api/v1/applications/<ID>/status \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"new_status": "applied"}'
```

> To get a `Bearer` token from the browser: open DevTools → Application → Cookies → copy the value of the `sb-*-auth-token` cookie, or use Supabase's `getSession()` in the browser console.

### 7 — CV Intelligence API (backend)

All resume endpoints require `Authorization: Bearer <supabase_access_token>`. The backend uses the Supabase **service role** server-side and enforces ownership via `user_id` on every query.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/resumes/upload` | Upload PDF/DOCX → parse → chunk → embed → store skills |
| `GET` | `/api/v1/resumes` | List current user's resumes (newest first) |
| `GET` | `/api/v1/resumes/{resume_id}` | Resume detail + sections + skills + chunk count |
| `GET` | `/api/v1/resumes/{resume_id}/chunks` | All chunks for a resume |
| `POST` | `/api/v1/resumes/query` | Semantic search over chunks (cosine similarity) |

**Upload a resume (PowerShell)**

```powershell
$token = "your_supabase_access_token"
$filePath = "E:\path\to\my_cv.pdf"

curl.exe -X POST "http://localhost:8000/api/v1/resumes/upload" `
  -H "Authorization: Bearer $token" `
  -F "file=@$filePath"
```

**Query resume chunks (PowerShell)**

```powershell
$token = "your_supabase_access_token"

curl.exe -X POST "http://localhost:8000/api/v1/resumes/query" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{\"query\": \"Python FastAPI experience\", \"top_k\": 5}'
```

Optional body fields for query: `resume_id` (scope to one resume), `top_k` (default `5`, max `50`).

**Pipeline (on upload):** validate file → extract text (pypdf / python-docx) → detect sections → chunk (900 chars, 150 overlap) → embed (`all-MiniLM-L6-v2`, 384-dim) → store `resumes`, `resume_sections`, `resume_chunks`, `user_skills` → set resume `is_active`, mark others inactive.

### 8 — CV Intelligence unit tests

```bash
cd backend

# Fast tests (no model download): parser, section detector, chunker, skill extractor
python -m pytest test/CV-intelligence/test_resume_parser.py test/CV-intelligence/test_section_detector.py test/CV-intelligence/test_chunker.py test/CV-intelligence/test_skill_extractor.py -v

# Embedding tests (requires all-MiniLM-L6-v2 cached — set HF_TOKEN in .env first)
$env:HF_TOKEN = "<your-huggingface-token>"   # or rely on repo root .env via Docker
python -m pytest test/CV-intelligence/test_embedding_service.py -v
```

---

## Environment Variables

Copy and fill in the repo root `.env` (gitignored). Docker Compose loads it for both services.

| Variable | Used by | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend base URL (e.g. `http://localhost:8000`) |
| `SUPABASE_URL` | Backend | Bare project URL (no `/rest/v1/` suffix) |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Service role key (server-side only) |
| `HF_TOKEN` | Backend / local dev | Hugging Face token for embedding model downloads |
| `ANTHROPIC_API_KEY` | Backend | Claude API (future assistant features) |

See [`backend/.env.example`](backend/.env.example) for a backend-only template.

---

## Feature Implementation Status

| Feature | Database | Backend Models | Backend API | Frontend UI |
|---|---|---|---|---|
| **Auth (Supabase)** | ✅ | ✅ | — | ✅ Login page + sessions |
| **Kanban Tracker** | ✅ | ✅ | ✅ Full CRUD + status | ✅ Full Kanban board |
| **Application History** | ✅ | ✅ | ✅ Included in detail | ✅ Timeline in drawer |
| **CV Upload / Parse / RAG** | ✅ | ✅ | ✅ Upload, list, detail, chunks, query | — |
| **User Skills (from CV)** | ✅ | ✅ | ✅ Extracted on upload | — |
| Job Search | ✅ | ✅ | — | — |
| Job Matching | ✅ | ✅ | — | — |
| AI Chat / Assistant | ✅ | ✅ | — | — |
| Cover Letter Gen | ✅ | ✅ | — | — |
| Roadmaps | ✅ | ✅ | — | — |
| Goals & Tasks | ✅ | ✅ | — | — |
| Calendar Events | ✅ | ✅ | — | — |
| Skill Gap Analysis | ✅ | ✅ | — | — |

---

## Application Statuses (Kanban Columns)

```
saved → applied → screening → interviewing → offered → accepted
                                                      → rejected
                                                      → withdrawn
```

---

## Known Issues

- `SUPABASE_URL` in the current `.env` contains a `/rest/v1/` suffix. The `supabase-py` client expects the bare project URL. Fix this before running the backend standalone or deploying.
- Hot reload inside Docker on Windows requires `WATCHPACK_POLLING=true` (already set in `docker-compose.yml`).

---

## Docs

- [`Docs/present-state.md`](Docs/present-state.md) — Detailed breakdown of what is implemented, request flow diagrams, and full table reference.
- [`Docs/db-design-initial.md`](Docs/db-design-initial.md) — Complete database schema documentation (~1 400 lines).
