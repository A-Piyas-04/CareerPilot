# CareerPilot

An AI-powered career co-pilot that helps users parse and understand their CV, find and rank matching jobs, and plan their career path with an AI assistant, goal tracker, and job application kanban board.

---

## Architecture

| Layer | Stack |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| State / Data | TanStack React Query |
| Notifications | Sonner (toast system) |
| Auth (client) | `@supabase/ssr` — HTTP-only cookie sessions |
| Backend | FastAPI + Uvicorn, Python 3.11 |
| Validation | Pydantic v2, pydantic-settings |
| Database | Supabase (PostgreSQL 15) — RLS on all tables |
| Vector search | pgvector `vector(384)` on `resume_chunks`, IVFFlat index |
| CV Embeddings | `HashingVectorizer` (default) **or** `sentence-transformers all-MiniLM-L6-v2` — switchable via `EMBEDDING_BACKEND` env var |
| AI Answers | Anthropic Claude (`claude-3-haiku-20240307`) — grounded in retrieved CV chunks |
| CV Parsing | `pypdf` (PDF), `python-docx` (DOCX) |
| Containers | Docker Compose — backend :8000, frontend :3000 |
| Migrations | Supabase CLI (`supabase db push`) |

The backend is organized into domain modules:

- `cv_intelligence` — CV upload, parsing, chunking, embedding, retrieval, LLM-grounded answers
- `job_intelligence` — job search and fit scoring (models defined, routes pending)
- `career_assistant` — kanban tracker, goals, tasks, AI chat (partial)
- `core` — shared auth, config, Supabase client, error mapping

---

## Project Structure

```
codesprint-2/
├── backend/
│   ├── main.py                    # FastAPI app, CORS, routers
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   └── app/
│       ├── core/                  # auth, config, database, enums, supabase_errors
│       ├── cv_intelligence/
│       │   ├── routes/resumes.py  # 7 endpoints
│       │   ├── models/            # Resume, ResumeSection, ResumeChunk, UserSkill
│       │   └── services/
│       │       ├── resume_service.py
│       │       ├── resume_parser.py
│       │       ├── section_detector.py
│       │       ├── chunker.py
│       │       ├── embedding_service.py   # dual-backend
│       │       ├── skill_extractor.py
│       │       ├── retrieval_service.py
│       │       ├── llm_service.py         # Anthropic Claude
│       │       └── _helpers.py            # shared Supabase row helpers
│       ├── career_assistant/      # applications, goals, tasks
│       └── job_intelligence/      # models only
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── app/                   # /, /login, /resume, /tracker, /goals, /calendar
│       ├── components/nav/        # AppNav — global navigation bar
│       ├── features/
│       │   ├── resume/            # CV upload, summary, AI answer, RAG query
│       │   ├── tracker/           # Kanban application board
│       │   └── goals/             # Goals and tasks workspace
│       └── lib/                   # Supabase clients, api.ts fetch wrapper
├── supabase/
│   ├── config.toml
│   └── migrations/
├── Docs/
│   ├── db-design-initial.md
│   ├── present-state.md
│   ├── cv-intelligence-implementation.md
│   ├── cv-intelligence-notes-and-fixes.md
│   └── embedding.txt
├── docker-compose.yml
└── package.json                   # root: Supabase CLI
```

---

## Getting Started

### Prerequisites

- Docker and Docker Compose (for the all-in-one workflow), **or**
- Python 3.11+ and Node.js 20+ for running services directly

### Environment variables

```bash
# Copy and fill in both env files:
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Key variables:

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | frontend | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | frontend | Public anon key |
| `NEXT_PUBLIC_API_URL` | frontend | FastAPI base URL (e.g. `http://localhost:8000`) |
| `SUPABASE_URL` | backend | Bare project URL — **no** `/rest/v1/` suffix |
| `SUPABASE_SERVICE_ROLE_KEY` | backend | Service role key — server only, never expose |
| `ANTHROPIC_API_KEY` | backend | Claude API key — enables `/api/v1/resumes/answer` |
| `EMBEDDING_BACKEND` | backend | `hashing` (default, fast) or `transformers` (semantic) |

### Run with Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

### Run individually

**Backend:**

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate   |   Unix: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

### Database migrations

```bash
npm install                # installs Supabase CLI
npx supabase link --project-ref <your-ref>
npx supabase db push
```

Or apply migrations individually in the **Supabase Dashboard → SQL Editor**.

---

## Feature Status

| Feature | Database | Backend API | Frontend UI |
|---|---|---|---|
| **Authentication** | `profiles` + trigger | — | Login + session cookies |
| **CV Upload / Parse / Embed** | `resumes`, `resume_sections`, `resume_chunks` | `POST /upload` | Upload card with progress strip |
| **CV Sections / Skills** | `resume_sections`, `user_skills` | `GET /{id}` detail | Expandable sections, category-colored skill chips |
| **Semantic Search (RAG)** | `resume_chunks` + pgvector | `POST /query` | Integrated into answer box |
| **AI-Grounded CV Answers** | — | `POST /answer` | "Ask about your CV" panel + evidence cards |
| **Delete Resume** | cascade | `DELETE /{id}` | Delete button with confirm dialog |
| **Kanban Tracker** | `applications`, `application_history` | Full CRUD | `/tracker` drag-and-drop |
| **Goals & Tasks** | `goals`, `tasks` | Full CRUD | `/goals` workspace |
| Job Intelligence | `jobs`, `job_matches` | — (models only) | — |
| AI Career Assistant | `assistant_*` | — | — |
| Cover Letter Gen | `cover_letters` | — | — |
| Skill Gap Analysis | `skill_gap_analysis` | — | — |
| Calendar | `calendar_events` | — (Supabase direct) | `/calendar` view |

---

## CV Intelligence API

Base path: `/api/v1/resumes` — all routes require `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/upload` | Upload PDF/DOCX → full parse/chunk/embed/skill pipeline |
| `GET` | `` | List user's resumes (newest first) |
| `GET` | `/{id}` | Detail: resume + sections + skills + chunk count |
| `GET` | `/{id}/chunks` | All text chunks (no embeddings in response) |
| `POST` | `/query` | Semantic search over chunks — returns top-k evidence |
| `POST` | `/answer` | LLM-grounded answer: retrieves chunks → asks Claude |
| `DELETE` | `/{id}` | Delete resume and all associated data (cascade) |

---

## Running Tests

```bash
cd backend
python -m pytest test/CV-intelligence/ -v
# Expected: 95 passed, 1 skipped
```

---

## Related Documentation

| Document | Purpose |
|---|---|
| [`Docs/present-state.md`](Docs/present-state.md) | Current implementation status and feature matrix |
| [`Docs/cv-intelligence-implementation.md`](Docs/cv-intelligence-implementation.md) | Full CV Intelligence architecture, pipeline, and API reference |
| [`Docs/cv-intelligence-notes-and-fixes.md`](Docs/cv-intelligence-notes-and-fixes.md) | Operational lessons, known fixes, and troubleshooting guide |
| [`Docs/db-design-initial.md`](Docs/db-design-initial.md) | Original database schema design reference |
