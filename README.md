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
| Vector Search | pgvector (enabled, for future CV/RAG features) |
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

The only fully implemented vertical feature is the **Kanban job application tracker**. Here is a step-by-step test walkthrough.

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

You should see all routes under `/api/v1/applications`.

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

---

## Feature Implementation Status

| Feature | Database | Backend Models | Backend API | Frontend UI |
|---|---|---|---|---|
| **Auth (Supabase)** | ✅ | ✅ | — | ✅ Login page + sessions |
| **Kanban Tracker** | ✅ | ✅ | ✅ Full CRUD + status | ✅ Full Kanban board |
| **Application History** | ✅ | ✅ | ✅ Included in detail | ✅ Timeline in drawer |
| CV Upload / Parse | ✅ | ✅ | — | — |
| User Skills | ✅ | ✅ | — | — |
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
