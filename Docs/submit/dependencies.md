# CareerPilot — Dependencies

> **Scope:** Runtime requirements, external services, and package manifests for the monorepo.  
> **Manifests:** [`frontend/package.json`](../../frontend/package.json), [`backend/requirements.txt`](../../backend/requirements.txt), [`package.json`](../../package.json)

---

## 1. Runtime & Tooling

| Requirement | Version | Used by |
|-------------|---------|---------|
| **Node.js** | 20 (Docker: `node:20-slim`) | Frontend, root Supabase CLI |
| **Python** | 3.11 (Docker: `python:3.11-slim`) | Backend API |
| **Docker + Compose** | — | Local dev (`docker-compose.yml`) |
| **npm** | — | Frontend install/build |
| **pip** | — | Backend install |

---

## 2. External Services & APIs

These are not npm/pip packages — they require accounts, API keys, and env configuration.

| Service | Purpose | Config (env vars) |
|---------|---------|-------------------|
| **Supabase** | PostgreSQL 15, Auth, RLS, pgvector, PostgREST | `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` |
| **Google Gemini** | Embeddings, chat, cover letters, skill gap, roadmaps, nudges | `GEMINI_API_KEY`, optional `GEMINI_*_MODEL` overrides |
| **JSearch (RapidAPI)** | Live job listings (external tool call) | `JSEARCH_API_KEY`, `JSEARCH_API_HOST`, `JSEARCH_BASE_URL` |
| **Hugging Face** | Optional model downloads for local embeddings | `HF_TOKEN` (only if using transformers backend) |

**Env templates:** [`backend/.env.example`](../../backend/.env.example), [`frontend/.env.example`](../../frontend/.env.example), [`.env.example`](../../.env.example)

**Database migrations:** [`supabase/migrations/`](../../supabase/migrations/) — applied via Supabase CLI or dashboard.

---

## 3. Frontend (`frontend/`)

### Production dependencies

| Package | Version | Role |
|---------|---------|------|
| `next` | 16.2.6 | App Router, SSR, API routes (BFF) |
| `react`, `react-dom` | 19.2.4 | UI runtime |
| `@supabase/ssr` | ^0.10.3 | Cookie-based auth sessions |
| `@supabase/supabase-js` | ^2.106.1 | Supabase client (browser + server) |
| `@tanstack/react-query` | ^5.100.14 | Server-state caching (dashboard, tracker) |
| `@hello-pangea/dnd` | ^18.0.1 | Kanban drag-and-drop (tracker) |
| `react-big-calendar` | ^1.19.4 | Calendar / deadline views |
| `recharts` | ^3.8.1 | Dashboard charts |
| `react-markdown` | ^10.1.0 | Render assistant markdown |
| `lucide-react` | ^1.16.0 | Icons |
| `date-fns` | ^4.3.0 | Date formatting |
| `sonner` | ^2.0.7 | Toast notifications |

### Dev dependencies

| Package | Role |
|---------|------|
| `typescript`, `@types/*` | Type checking |
| `tailwindcss`, `@tailwindcss/postcss` | Styling (v4) |
| `eslint`, `eslint-config-next` | Linting |
| `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` | Unit/component tests |
| `babel-plugin-react-compiler` | React Compiler (Next 16) |

---

## 4. Backend (`backend/`)

| Package | Role |
|---------|------|
| `fastapi` | REST API framework |
| `uvicorn[standard]` | ASGI server |
| `python-dotenv` | Load `.env` |
| `pydantic`, `pydantic-settings` | Request/response models, config |
| `python-multipart` | File uploads (CV PDF/DOCX) |
| `supabase` | Python Supabase client (service role) |
| `httpx` | Async HTTP (JSearch, external calls) |
| `sqlalchemy[asyncio]`, `asyncpg` | Async Postgres access |
| `alembic` | Schema migrations |
| `pgvector` | Vector column types / similarity |
| `pypdf`, `python-docx` | CV text extraction |
| `numpy` | Numeric helpers (fit scoring) |
| `google-generativeai` | Gemini embeddings & generation |
| `pytest` | Backend tests |

### Optional (not installed by default)

| Package | When to install |
|---------|-----------------|
| `sentence-transformers` | Local embeddings: `pip install sentence-transformers` + `EMBEDDING_BACKEND=transformers` (~2 GB with PyTorch) |

---

## 5. Root (`/`)

| Package | Version | Role |
|---------|---------|------|
| `supabase` | ^2.101.0 | Supabase CLI (migrations, local dev) |

---

## 6. Install Commands

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && pip install -r requirements.txt

# Root (Supabase CLI)
npm install

# Full stack (Docker)
docker compose up --build
```

---

## 7. Related Docs

| Doc | Focus |
|-----|-------|
| [`stack-report.md`](./stack-report.md) | Why each technology was chosen |
| [`system-design.md`](./system-design.md) | Architecture, data flow, deployment |
| [`README.md`](../../README.md) | Setup and run instructions |

---

*Submission artifact — `Docs/submit/`*
