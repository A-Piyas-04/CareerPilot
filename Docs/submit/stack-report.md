# CareerPilot — Stack Report & Justification

> **Product:** AI career co-pilot (CV intelligence, job search, assistant, tracker)  
> **Audit date:** June 2026  
> **Scope:** Why this stack was chosen — brief, decision-focused

---

## 1. Stack at a Glance

| Layer | Technology | Role |
|-------|------------|------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 | Workspace UI, auth gates, BFF routes for streaming AI |
| **Backend API** | FastAPI, Python 3.11, Uvicorn | CV pipeline, job search, fit scoring, tracker, shared RAG |
| **Database & Auth** | Supabase (PostgreSQL 15, pgvector, Auth, RLS) | Single store for users, vectors, and career data |
| **Embeddings & LLM** | Google Gemini | Chunk embeddings, chat, cover letters, skill gap, roadmaps, nudges |
| **Job listings** | JSearch (RapidAPI) | Live job search (external tool call) |
| **Dev / deploy** | Docker Compose locally; Vercel + Railway + Supabase Pro (target) | Runnable demo + clear production path |

---

## 2. Justification by Layer

### Frontend — Next.js + React

**Chosen because:** One codebase for marketing pages and the authenticated workspace; App Router supports server components and route handlers for AI streaming without a separate Node server.

**Fits the product:** Job Hunter, chat, and dashboard need fast navigation and server-side auth checks. TanStack Query handles cached fetches; BFF routes (`/api/assistant/chat`, cover letters, dashboard) keep Gemini keys off the client.

**Alternatives considered:** Plain React SPA would need a separate API gateway for SSR auth and streaming. We avoided that extra layer for a hackathon-sized team.

---

### Backend — FastAPI (Python)

**Chosen because:** CV processing (PDF/DOCX parse, chunking, batch embeddings) and numeric fit scoring are natural in Python. FastAPI gives typed APIs, async I/O, and quick iteration.

**Fits the product:** Three modules map cleanly to product pillars — `cv_intelligence`, `job_intelligence`, `career_assistant`. Long-running upload work stays on a persistent worker, not serverless timeouts.

**Alternatives considered:** Node-only backend would duplicate PDF/ML tooling or call out to another service. Keeping heavy logic in Python reduces moving parts.

---

### Data — Supabase (Postgres + pgvector + Auth)

**Chosen because:** Relational data (applications, goals, messages) and vector search (resume chunks) live in one database. Built-in auth and RLS cover direct client reads (calendar, tasks) while the backend uses a service role for RAG and scoring.

**Fits the product:** “Upload CV once, use everywhere” needs durable chunks + skills indexed once and queried by jobs, chat, and generation. pgvector avoids a separate vector DB for our scale.

**Alternatives considered:** Firebase (weaker SQL/vector story); standalone Pinecone (extra service + sync). Supabase keeps auth, SQL, and vectors together.

---

### AI — Google Gemini

**Chosen because:** Single provider for embeddings and generation simplifies config and billing. Gemini supports batch embeddings, streaming chat, and structured JSON for roadmaps and nudges.

**Fits the product:** Assistant, cover letters, skill gap, roadmaps, interview prep, and CV Q&A all share one API. Fit scores remain **programmatic** (not LLM-only), satisfying the requirement for deterministic job matching.

**Alternatives considered:** OpenAI — viable, but we standardized on Gemini for embeddings + chat parity. Local models were ruled out for demo reliability and setup cost.

---

### Job search — JSearch (RapidAPI)

**Chosen because:** Hackathon requires at least one **live external tool call**. JSearch returns structured listings (title, company, location, description) suitable for fit scoring and tracker save.

**Fits the product:** Job Hunter agent searches real postings, persists results, and deep-links to cover letter, skill gap, roadmap, and chat with job context.

**Alternatives considered:** Static/mock job data would fail the live-agent requirement. Scraping directly adds legal and maintenance risk; a paid API is acceptable for a prototype.

---

## 3. Architecture Choice (Hybrid)

```text
Browser → Next.js (UI + some BFF) → FastAPI (heavy compute) → Supabase
                    ↓                        ↓
                 Gemini                   JSearch
```

| Path | Used for | Why split |
|------|----------|-----------|
| **FastAPI** | CV upload, job search, fit score, tracker | CPU/API-heavy; service-role DB access |
| **Next.js BFF** | Chat stream, cover letter, dashboard nudges | SSE streaming near the UI |
| **Supabase direct** | Calendar, simple CRUD | RLS-enforced reads/writes without round-tripping the backend |

**Trade-off:** Gemini is called from both FastAPI and Next.js — acceptable for the hackathon; production would centralize AI calls and quotas (see system design doc).

---

## 4. Supporting Libraries (High Level)

| Area | Choice | Why (one line) |
|------|--------|----------------|
| UI | Tailwind CSS 4, Lucide | Fast, consistent workspace UI |
| State | TanStack Query | Cache dashboard/tracker; fewer duplicate requests |
| Tracker UI | @hello-pangea/dnd | Kanban drag-and-drop |
| Calendar | react-big-calendar | Deadline and interview views |
| PDF/DOCX | pypdf, python-docx | Server-side CV text extraction |
| Tests | Vitest (frontend), pytest (backend) | Matches each runtime |

---

## 5. What We Deliberately Did Not Use

| Omitted | Reason |
|---------|--------|
| Separate vector DB (Pinecone, Weaviate) | pgvector is enough at hackathon scale |
| Local LLM / Ollama | Setup friction and inconsistent demo quality |
| Microservices | One FastAPI app + one Next app is enough for four pillars |
| Custom auth server | Supabase Auth covers signup, sessions, JWT for API |

---

## 6. Summary

CareerPilot’s stack optimizes for **one RAG store**, **live job search**, and **fast full-stack delivery**: Next.js for UX and streaming, FastAPI for CV/job logic, Supabase for data and vectors, Gemini for AI, JSearch for external listings. Each choice maps to a product requirement rather than novelty — with a documented path to scale (async CV workers, Redis cache, centralized AI gateway) in [`system-design.md`](./system-design.md).

---

*Submission artifact — `Docs/submit/`*
