# CareerPilot — Database Schema Documentation

> **Last updated:** May 29, 2026  
> **Authoritative SQL:** `supabase/migrations/` (apply via `supabase db push`)  
> **Runtime reference:** [`present-state.md`](present-state.md) for feature ↔ API ↔ UI wiring

## Purpose

This document defines the PostgreSQL schema for CareerPilot (Supabase), organized by the original 3-member team modules. It describes **every table, enum, index, RLS policy, grant, and database function** — and records which parts are **live in production code** vs **schema-only placeholders**.

The database is organized into:

1. **Member 1 — CV Intelligence** — resumes, sections, chunks, embeddings, skills
2. **Member 2 — Job Intelligence** — job searches, jobs, fit matches
3. **Member 3 — Career Assistant & Tracker** — Kanban, goals, tasks, calendar, AI chat
4. **Shared/Core** — profiles, evaluation tests

---

## Implementation Status (May 2026)

| Table / object | DB | Backend writes | Frontend reads/writes | Notes |
| --- | --- | --- | --- | --- |
| `profiles` | ✅ | trigger on signup | Supabase (auth, assistant) | `handle_new_user()` |
| `resumes` | ✅ | FastAPI service role | FastAPI + UI `/resume` | No Storage upload (`file_url` unused) |
| `resume_sections` | ✅ | FastAPI | via resume detail | |
| `resume_chunks` | ✅ | FastAPI (Gemini embed) | RAG via FastAPI | See embedding dimensions below |
| `user_skills` | ✅ | FastAPI upsert | resume detail UI | unique `(user_id, skill_name)` |
| `job_searches` | ✅ | FastAPI | — | |
| `jobs` | ✅ | FastAPI | match cards | RLS: authenticated SELECT |
| `job_matches` | ✅ | FastAPI upsert | `/jobs` | unique `(user_id, job_id, resume_id)` |
| `applications` | ✅ | FastAPI + RPC | `/tracker` | manual_* columns + job link |
| `application_history` | ✅ | RPC only | detail drawer | INSERT via `change_application_status` |
| `goals` | ✅ | FastAPI | `/goals` | |
| `tasks` | ✅ | FastAPI + Supabase | goals + standalone list | `priority` 1–3 constraint |
| `calendar_events` | ✅ | — | Supabase direct `/calendar` | |
| `assistant_conversations` | ✅ | — | Supabase direct `/chat` | |
| `assistant_messages` | ✅ | Next.js route | `/chat` stream | metadata stores intent |
| `cover_letters` | ✅ schema | — | — | Not wired |
| `roadmaps` / `roadmap_items` | ✅ schema | — | — | Chat intent only |
| `skill_gap_analysis` | ✅ schema | — | — | Chat intent only |
| `evaluation_tests` | ✅ schema | — | — | Hackathon eval suite |
| `match_resume_chunks` RPC | ✅ | FastAPI retrieval | — | `vector(384)` in migration — see below |
| `change_application_status` RPC | ✅ | FastAPI PATCH status | Kanban drag | atomic history insert |
| `embedding_new` column | Alembic | reembed script | — | `vector(768)` default; not in Supabase migrations yet |

### Access patterns

| Client | Key | RLS | Typical use |
| --- | --- | --- | --- |
| Browser (logged-in user) | `anon` + JWT | **Enforced** | Calendar, tasks, assistant CRUD |
| FastAPI backend | `service_role` | **Bypassed** | CV pipeline, jobs, applications, goals; must filter `user_id` in code |
| Next.js assistant route | `service_role` or server Supabase | Mixed | Conversations/messages |

**Grants:** Several migrations explicitly `GRANT` table privileges to `authenticated` and `service_role` (required for PostgREST even when RLS policies exist). See [Migrations & Grants](#migrations--grants).

### Embedding columns (`resume_chunks`)

| Column | Origin | Dimension | Used when |
| --- | --- | --- | --- |
| `embedding` | Initial migration `20250525000001` | `vector(384)` | `EMBEDDING_ACTIVE_COLUMN=embedding` (legacy) |
| `embedding_new` | Alembic `2b7f66d7a1b2` | `vector(768)` default | Gemini rollout / backfill |

**Runtime default:** Gemini `models/embedding-001` at **768 dimensions** (`EMBEDDING_VECTOR_DIM=768`). The pgvector RPC functions in `20250527000000_match_resume_chunks_rpc.sql` still declare `vector(384)` — **production must align** RPC signature, active column, and stored dimension before relying on IVFFlat RPC (numpy fallback works cross-dim only when `RETRIEVAL_REQUIRE_DIM_MATCH=false`).

---

# High-Level Ownership Map

| Team Area                  | Responsible Member | Main Responsibility                                                     |
| -------------------------- | ------------------ | ----------------------------------------------------------------------- |
| CV Intelligence            | Member 1           | Upload CV, parse, chunk, embed, store, retrieve                         |
| Job Intelligence           | Member 2           | Search jobs, create job cards, compute fit score, rank jobs             |
| Career Assistant & Tracker | Member 3           | AI chat, cover letters, roadmap, calendar, Kanban, dashboard, reminders |
| Shared/Core                | All Members        | Users, auth, evaluation tests, shared references                        |

---

# Database Relationship Overview

```text
profiles
 │
 ├── Member 1: CV Intelligence
 │     ├── resumes
 │     ├── resume_sections
 │     ├── resume_chunks
 │     └── user_skills
 │
 ├── Member 2: Job Intelligence
 │     ├── job_searches
 │     ├── jobs
 │     └── job_matches
 │
 ├── Member 3: Career Assistant & Tracker
 │     ├── assistant_conversations
 │     ├── assistant_messages
 │     ├── cover_letters
 │     ├── roadmaps
 │     ├── roadmap_items
 │     ├── applications
 │     ├── application_history
 │     ├── goals
 │     ├── tasks
 │     ├── calendar_events
 │     └── skill_gap_analysis
 │
 └── Shared/Core
       └── evaluation_tests
```

---

# Shared/Core Module

## Responsibility

Owned by all members.

This module supports authentication, user identity, and evaluation.

---

# Table: profiles

## Purpose

Stores user profile data and connects the app database with Supabase Auth.

## Responsible For

* User identity
* Personalization
* Target role
* User-level ownership for all modules

## Relationships

| From     | To                      | Relationship |
| -------- | ----------------------- | ------------ |
| profiles | resumes                 | One-to-Many  |
| profiles | job_searches            | One-to-Many  |
| profiles | job_matches             | One-to-Many  |
| profiles | applications            | One-to-Many  |
| profiles | assistant_conversations | One-to-Many  |
| profiles | tasks                   | One-to-Many  |
| profiles | calendar_events         | One-to-Many  |

## Attributes

| Column      | Type        | Required | Description                                     |
| ----------- | ----------- | -------- | ----------------------------------------------- |
| id          | UUID        | Yes      | Primary key. References Supabase auth.users(id) |
| full_name   | TEXT        | No       | User full name                                  |
| email       | TEXT        | No       | Unique email address                            |
| avatar_url  | TEXT        | No       | User profile image URL                          |
| target_role | TEXT        | No       | Desired career role                             |
| location    | TEXT        | No       | User location                                   |
| bio         | TEXT        | No       | Short user bio                                  |
| created_at  | TIMESTAMPTZ | Yes      | Profile creation time                           |
| updated_at  | TIMESTAMPTZ | Yes      | Last profile update time                        |

---

# Table: evaluation_tests

## Purpose

Stores documented test cases for the hackathon evaluation suite.

## Responsible For

* Bonus marks evaluation suite
* Feature testing records
* Expected vs actual output tracking

## Relationships

This table is mostly standalone.

## Attributes

| Column          | Type        | Required | Description          |
| --------------- | ----------- | -------- | -------------------- |
| id              | UUID        | Yes      | Test case ID         |
| feature_name    | TEXT        | Yes      | Feature being tested |
| input_data      | JSONB       | Yes      | Test input           |
| expected_output | TEXT        | No       | Expected result      |
| actual_output   | TEXT        | No       | Actual result        |
| passed          | BOOLEAN     | No       | Pass/fail result     |
| notes           | TEXT        | No       | Extra notes          |
| created_at      | TIMESTAMPTZ | Yes      | Test creation time   |

---

# Member 1 Module — CV Intelligence

## Owner

Member 1

## Final Deliverable

The system understands the user profile from their CV.

**Status:** Fully implemented end-to-end (`/resume`, FastAPI `/api/v1/resumes/*`, Gemini embeddings + answers).

## Responsible Features

* CV upload
* PDF/DOCX parsing
* Resume text extraction
* Resume section detection
* Chunking
* Embeddings
* Vector storage using pgvector
* RAG retrieval
* Skill extraction from CV

## Tables Owned By Member 1

| Table           | Purpose                                  |
| --------------- | ---------------------------------------- |
| resumes         | Stores uploaded CV metadata and raw text |
| resume_sections | Stores parsed CV sections                |
| resume_chunks   | Stores chunks and embeddings for RAG     |
| user_skills     | Stores extracted user skills             |

---

# Table: resumes

## Purpose

Stores uploaded resume/CV metadata, file reference, raw extracted text, and processing status.

## Responsible For

* CV upload records
* PDF/DOCX file metadata
* Raw extracted resume text
* Resume processing status

## Relationships

| From    | To                 | Relationship |
| ------- | ------------------ | ------------ |
| resumes | profiles           | Many-to-One  |
| resumes | resume_sections    | One-to-Many  |
| resumes | resume_chunks      | One-to-Many  |
| resumes | user_skills        | One-to-Many  |
| resumes | job_matches        | One-to-Many  |
| resumes | cover_letters      | One-to-Many  |
| resumes | skill_gap_analysis | One-to-Many  |

## Attributes

| Column         | Type               | Required | Description                              |
| -------------- | ------------------ | -------- | ---------------------------------------- |
| id             | UUID               | Yes      | Resume ID                                |
| user_id        | UUID               | Yes      | Owner user. References profiles(id)      |
| file_name      | TEXT               | Yes      | Original uploaded file name              |
| file_type      | TEXT               | Yes      | File type such as pdf/docx               |
| file_url       | TEXT               | No       | Supabase Storage URL/path                |
| raw_text       | TEXT               | No       | Full extracted text from CV              |
| parsed_summary | JSONB              | No       | Optional structured summary of parsed CV |
| status         | resume_status ENUM | Yes      | uploaded, processing, processed, failed  |
| is_active      | BOOLEAN            | Yes      | Whether this is the active resume        |
| error_message  | TEXT               | No       | Error message if processing fails        |
| created_at     | TIMESTAMPTZ        | Yes      | Upload time                              |
| updated_at     | TIMESTAMPTZ        | Yes      | Last update time                         |

---

# Table: resume_sections

## Purpose

Stores parsed sections from a resume.

Example sections:

* summary
* education
* skills
* experience
* projects
* certifications

## Responsible For

* Structured CV understanding
* Section-level retrieval
* Cleaner downstream skill and experience analysis

## Relationships

| From            | To            | Relationship |
| --------------- | ------------- | ------------ |
| resume_sections | resumes       | Many-to-One  |
| resume_sections | profiles      | Many-to-One  |
| resume_sections | resume_chunks | One-to-Many  |

## Attributes

| Column        | Type        | Required | Description                                      |
| ------------- | ----------- | -------- | ------------------------------------------------ |
| id            | UUID        | Yes      | Resume section ID                                |
| resume_id     | UUID        | Yes      | Parent resume. References resumes(id)            |
| user_id       | UUID        | Yes      | Owner user. References profiles(id)              |
| section_name  | TEXT        | Yes      | Section name such as skills, projects, education |
| section_order | INTEGER     | No       | Original order inside resume                     |
| content       | TEXT        | Yes      | Full text content of this section                |
| metadata      | JSONB       | No       | Extra parser metadata                            |
| created_at    | TIMESTAMPTZ | Yes      | Creation time                                    |

---

# Table: resume_chunks

## Purpose

Stores resume text chunks and vector embeddings for semantic search.

This is the main RAG table.

## Responsible For

* Vector retrieval
* RAG grounding
* Job match evidence
* Assistant answer evidence

## Relationships

| From                                  | To               | Relationship    |
| ------------------------------------- | ---------------- | --------------- |
| resume_chunks                         | resumes          | Many-to-One     |
| resume_chunks                         | resume_sections  | Many-to-One     |
| resume_chunks                         | profiles         | Many-to-One     |
| job_matches.evidence_chunks           | resume_chunks.id | Reference array |
| assistant_messages.used_resume_chunks | resume_chunks.id | Reference array |

## Attributes

| Column       | Type        | Required | Description                                    |
| ------------ | ----------- | -------- | ---------------------------------------------- |
| id           | UUID        | Yes      | Resume chunk ID                                |
| resume_id    | UUID        | Yes      | Parent resume. References resumes(id)          |
| user_id      | UUID        | Yes      | Owner user. References profiles(id)            |
| section_id   | UUID        | No       | Parent section. References resume_sections(id) |
| section_name | TEXT        | No       | Section label for quick filtering              |
| chunk_index  | INTEGER     | Yes      | Order of chunk inside resume                   |
| chunk_text   | TEXT        | Yes      | Text content of the chunk                      |
| token_count  | INTEGER     | No       | Approximate token count                        |
| embedding    | VECTOR(384) | No       | Legacy IVFFlat column (initial migration)      |
| embedding_new| VECTOR(768) | No       | Gemini backfill column (Alembic; optional)     |
| metadata     | JSONB       | No       | Extra chunk metadata                           |
| created_at   | TIMESTAMPTZ | Yes      | Creation time                                  |

### Indexes

- `idx_resume_chunks_embedding` — IVFFlat on `embedding` (`vector_cosine_ops`)
- `idx_resume_chunks_embedding_new` — IVFFlat on `embedding_new` (Alembic, when applied)

### Retrieval RPC

`match_resume_chunks(query_embedding, match_user_id, match_count)` and `match_resume_chunks_with_resume(..., match_resume_id, ...)` return top-k rows ordered by cosine distance (`<=>`). Called from `backend/app/cv_intelligence/services/retrieval_service.py` when `EMBEDDING_ACTIVE_COLUMN=embedding`.

---

# Table: user_skills

## Purpose

Stores structured skills extracted from the user's resume or added manually.

## Responsible For

* User skill profile
* Skill matching
* Skill gap analysis
* Dashboard skill stats

## Relationships

| From        | To       | Relationship |
| ----------- | -------- | ------------ |
| user_skills | profiles | Many-to-One  |
| user_skills | resumes  | Many-to-One  |

## Attributes

| Column      | Type        | Required | Description                                      |
| ----------- | ----------- | -------- | ------------------------------------------------ |
| id          | UUID        | Yes      | Skill ID                                         |
| user_id     | UUID        | Yes      | Owner user. References profiles(id)              |
| resume_id   | UUID        | No       | Source resume. References resumes(id)            |
| skill_name  | TEXT        | Yes      | Skill name                                       |
| category    | TEXT        | No       | Skill category such as language/tool/framework   |
| proficiency | TEXT        | No       | Beginner/intermediate/advanced or inferred level |
| evidence    | TEXT        | No       | Evidence text from resume                        |
| source      | TEXT        | Yes      | resume/manual/ai                                 |
| created_at  | TIMESTAMPTZ | Yes      | Creation time                                    |

---

# Member 2 Module — Job Intelligence

## Owner

Member 2

**Status:** Search, scoring, persistence, and save-to-tracker are **live** (`/jobs`, FastAPI `/api/v1/jobs/*`). Manual paste API exists without dedicated UI.

## Final Deliverable

The system finds and ranks relevant jobs.

## Responsible Features

* Job search API or scraping
* Job cards
* Fit score
* Skill matching
* Ranking logic
* Match explanation

## Tables Owned By Member 2

| Table        | Purpose                                |
| ------------ | -------------------------------------- |
| job_searches | Stores job search queries              |
| jobs         | Stores structured job cards            |
| job_matches  | Stores fit scores and ranking evidence |

---

# Table: job_searches

## Purpose

Stores each job search request made by the user.

## Responsible For

* Tracking search queries
* Saving filters
* Connecting search results to user intent

## Relationships

| From         | To       | Relationship |
| ------------ | -------- | ------------ |
| job_searches | profiles | Many-to-One  |
| job_searches | jobs     | One-to-Many  |

## Attributes

| Column     | Type        | Required | Description                                |
| ---------- | ----------- | -------- | ------------------------------------------ |
| id         | UUID        | Yes      | Search ID                                  |
| user_id    | UUID        | Yes      | Owner user. References profiles(id)        |
| query      | TEXT        | Yes      | Search query, e.g. ML internships in Dhaka |
| location   | TEXT        | No       | Search location                            |
| filters    | JSONB       | No       | Search filters like remote, salary, date   |
| source     | TEXT        | No       | API/scraper source                         |
| created_at | TIMESTAMPTZ | Yes      | Search time                                |

---

# Table: jobs

## Purpose

Stores structured job posting data.

## Responsible For

* Job cards
* Job detail pages
* Fit score input
* Application tracking source

## Relationships

| From | To                 | Relationship         |
| ---- | ------------------ | -------------------- |
| jobs | job_searches       | Many-to-One          |
| jobs | job_matches        | One-to-Many          |
| jobs | applications       | One-to-Many          |
| jobs | cover_letters      | One-to-Many          |
| jobs | skill_gap_analysis | One-to-Many          |
| jobs | assistant_messages | One-to-Many optional |

## Attributes

| Column       | Type        | Required | Description                                |
| ------------ | ----------- | -------- | ------------------------------------------ |
| id           | UUID        | Yes      | Job ID                                     |
| search_id    | UUID        | No       | Parent search. References job_searches(id) |
| title        | TEXT        | Yes      | Job title                                  |
| company      | TEXT        | No       | Company name                               |
| location     | TEXT        | No       | Job location                               |
| salary_range | TEXT        | No       | Salary information                         |
| job_type     | TEXT        | No       | Internship/full-time/remote/etc            |
| deadline     | DATE        | No       | Application deadline                       |
| description  | TEXT        | No       | Job description                            |
| requirements | TEXT        | No       | Job requirements                           |
| source       | TEXT        | No       | Source platform/API                        |
| source_url   | TEXT        | No       | Original job URL                           |
| raw_data     | JSONB       | No       | Original unmodified source data            |
| created_at   | TIMESTAMPTZ | Yes      | Creation time                              |

---

# Table: job_matches

## Purpose

Stores computed fit scores between a user resume and a job posting.

## Responsible For

* Fit score
* Skill matching
* Missing skill detection
* Match explanation
* Job ranking

## Relationships

| From                        | To               | Relationship        |
| --------------------------- | ---------------- | ------------------- |
| job_matches                 | profiles         | Many-to-One         |
| job_matches                 | resumes          | Many-to-One         |
| job_matches                 | jobs             | Many-to-One         |
| job_matches                 | applications     | One-to-One optional |
| job_matches.evidence_chunks | resume_chunks.id | Reference array     |

## Attributes

| Column          | Type         | Required | Description                              |
| --------------- | ------------ | -------- | ---------------------------------------- |
| id              | UUID         | Yes      | Match ID                                 |
| user_id         | UUID         | Yes      | Owner user. References profiles(id)      |
| resume_id       | UUID         | No       | Resume used for scoring                  |
| job_id          | UUID         | Yes      | Job being scored                         |
| fit_score       | NUMERIC(5,2) | Yes      | Percentage fit score                     |
| matched_skills  | TEXT[]       | No       | Skills found in both CV and job          |
| missing_skills  | TEXT[]       | No       | Skills required by job but missing in CV |
| explanation     | TEXT         | No       | Human-readable match explanation         |
| evidence_chunks | UUID[]       | No       | Resume chunk IDs used as evidence        |
| created_at      | TIMESTAMPTZ  | Yes      | Match creation time                      |

### Constraints

- **Unique:** `(user_id, job_id, resume_id)` — backend upserts on conflict when re-scoring the same job for the same resume.

### Fit score formula (application layer)

`fit_score = round(100 × (0.6 × skills_overlap_ratio + 0.4 × mean_top5_chunk_similarity), 2)` — implemented in `backend/app/job_intelligence/services/job_scorer.py`.

---

# Member 3 Module — Career Assistant & Tracker

## Owner

Member 3

**Status:** Kanban, goals, tasks, calendar, and AI chat are **live**. Cover letters, roadmaps, and skill gap tables exist but are not written to by application code yet.

## Final Deliverable

The system helps the user execute career goals daily.

## Responsible Features

* AI chat
* Cover letter generation
* Roadmap generation
* Calendar
* Kanban board
* Dashboard
* AI reminders
* Goal tracking
* To-do system
* Skill gap analysis

## Tables Owned By Member 3

| Table                   | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| assistant_conversations | Stores AI chat sessions                     |
| assistant_messages      | Stores chat memory and grounded answers     |
| cover_letters           | Stores generated cover letters              |
| roadmaps                | Stores generated learning roadmaps          |
| roadmap_items           | Stores roadmap tasks/steps                  |
| applications            | Stores Kanban application cards             |
| application_history     | Stores application status changes           |
| goals                   | Stores career goals                         |
| tasks                   | Stores to-do items                          |
| calendar_events         | Stores deadlines/reminders/events           |
| skill_gap_analysis      | Stores readiness and missing skill analysis |

---

# Table: assistant_conversations

## Purpose

Stores AI assistant chat sessions.

## Responsible For

* Session memory
* Conversation grouping
* Assistant context

## Relationships

| From                    | To                 | Relationship |
| ----------------------- | ------------------ | ------------ |
| assistant_conversations | profiles           | Many-to-One  |
| assistant_conversations | assistant_messages | One-to-Many  |

## Attributes

| Column     | Type        | Required | Description                         |
| ---------- | ----------- | -------- | ----------------------------------- |
| id         | UUID        | Yes      | Conversation ID                     |
| user_id    | UUID        | Yes      | Owner user. References profiles(id) |
| title      | TEXT        | No       | Conversation title                  |
| context    | JSONB       | No       | Stored session context              |
| created_at | TIMESTAMPTZ | Yes      | Conversation creation time          |
| updated_at | TIMESTAMPTZ | Yes      | Last update time                    |

---

# Table: assistant_messages

## Purpose

Stores individual chat messages.

## Responsible For

* Conversational memory
* AI response history
* Grounding traceability
* Related job context

## Relationships

| From                                  | To                      | Relationship         |
| ------------------------------------- | ----------------------- | -------------------- |
| assistant_messages                    | assistant_conversations | Many-to-One          |
| assistant_messages                    | profiles                | Many-to-One          |
| assistant_messages.used_job_id        | jobs                    | Many-to-One optional |
| assistant_messages.used_resume_chunks | resume_chunks.id        | Reference array      |

## Attributes

| Column             | Type              | Required | Description                                   |
| ------------------ | ----------------- | -------- | --------------------------------------------- |
| id                 | UUID              | Yes      | Message ID                                    |
| conversation_id    | UUID              | Yes      | Parent conversation                           |
| user_id            | UUID              | Yes      | Owner user                                    |
| role               | message_role ENUM | Yes      | user/assistant/system                         |
| content            | TEXT              | Yes      | Message content                               |
| used_resume_chunks | UUID[]            | No       | Resume chunks used for grounding              |
| used_job_id        | UUID              | No       | Related job if assistant answered about a job |
| metadata           | JSONB             | No       | Extra LLM metadata                            |
| created_at         | TIMESTAMPTZ       | Yes      | Message time                                  |

### Typical `metadata` keys (assistant route)

| Key | Description |
| --- | --- |
| `model` | Gemini model id used for the reply |
| `streamed` | `true` when response was SSE-streamed |
| `intent` | `readiness_check`, `skill_gap`, `roadmap_generation`, `cover_letter`, `general` |
| `intent_confidence` | 0–1 from rule or classifier |
| `intent_detection_method` | `rule`, `model`, or `fallback` |
| `can_save_roadmap` | `true` when intent is `roadmap_generation` |
| `can_save_cover_letter` | `true` when intent is `cover_letter` |

**Writes:** `POST /api/assistant/chat` (Next.js) inserts user message before stream and assistant message after stream completes. No UPDATE policy on messages (append-only from client).

---

# Table: cover_letters

> **Implementation:** Schema + RLS only. Not populated by backend or chat route yet.

## Purpose

Stores generated cover letters.

## Responsible For

* Personalized cover letter generation
* Version history
* Resume + job grounded writing

## Relationships

| From          | To       | Relationship |
| ------------- | -------- | ------------ |
| cover_letters | profiles | Many-to-One  |
| cover_letters | resumes  | Many-to-One  |
| cover_letters | jobs     | Many-to-One  |

## Attributes

| Column     | Type        | Required | Description                 |
| ---------- | ----------- | -------- | --------------------------- |
| id         | UUID        | Yes      | Cover letter ID             |
| user_id    | UUID        | Yes      | Owner user                  |
| resume_id  | UUID        | No       | Resume used for letter      |
| job_id     | UUID        | No       | Target job                  |
| title      | TEXT        | No       | Cover letter title          |
| content    | TEXT        | Yes      | Generated cover letter body |
| version    | INTEGER     | Yes      | Version number              |
| created_at | TIMESTAMPTZ | Yes      | Creation time               |
| updated_at | TIMESTAMPTZ | Yes      | Last update time            |

---

# Table: roadmaps

> **Implementation:** Schema + RLS only. Chat sets `can_save_roadmap` in message metadata but does not INSERT here yet.

## Purpose

Stores generated learning/career roadmaps.

## Responsible For

* 3-month roadmap generation
* Career planning
* Progress tracking

## Relationships

| From     | To            | Relationship |
| -------- | ------------- | ------------ |
| roadmaps | profiles      | Many-to-One  |
| roadmaps | roadmap_items | One-to-Many  |

## Attributes

| Column           | Type         | Required | Description           |
| ---------------- | ------------ | -------- | --------------------- |
| id               | UUID         | Yes      | Roadmap ID            |
| user_id          | UUID         | Yes      | Owner user            |
| target_role      | TEXT         | Yes      | Career target         |
| duration_weeks   | INTEGER      | No       | Roadmap duration      |
| overview         | TEXT         | No       | Roadmap summary       |
| progress_percent | NUMERIC(5,2) | Yes      | Completion percentage |
| created_at       | TIMESTAMPTZ  | Yes      | Creation time         |
| updated_at       | TIMESTAMPTZ  | Yes      | Last update time      |

---

# Table: roadmap_items

## Purpose

Stores individual roadmap steps.

## Responsible For

* Weekly roadmap tasks
* Learning resource planning
* Roadmap progress

## Relationships

| From          | To       | Relationship |
| ------------- | -------- | ------------ |
| roadmap_items | roadmaps | Many-to-One  |
| roadmap_items | profiles | Many-to-One  |
| roadmap_items | tasks    | One-to-Many  |

## Attributes

| Column       | Type             | Required | Description                     |
| ------------ | ---------------- | -------- | ------------------------------- |
| id           | UUID             | Yes      | Roadmap item ID                 |
| roadmap_id   | UUID             | Yes      | Parent roadmap                  |
| user_id      | UUID             | Yes      | Owner user                      |
| week_number  | INTEGER          | No       | Week number                     |
| title        | TEXT             | Yes      | Roadmap item title              |
| description  | TEXT             | No       | Item details                    |
| resources    | JSONB            | No       | Learning resources              |
| status       | task_status ENUM | Yes      | todo/in_progress/done/cancelled |
| due_date     | DATE             | No       | Due date                        |
| completed_at | TIMESTAMPTZ      | No       | Completion time                 |
| created_at   | TIMESTAMPTZ      | Yes      | Creation time                   |

---

# Table: applications

## Purpose

Stores application tracker/Kanban cards.

## Responsible For

* Kanban board
* Application tracking
* Dashboard application stats

## Relationships

| From         | To                  | Relationship         |
| ------------ | ------------------- | -------------------- |
| applications | profiles            | Many-to-One          |
| applications | jobs                | Many-to-One          |
| applications | job_matches         | Many-to-One optional |
| applications | application_history | One-to-Many          |
| applications | tasks               | One-to-Many          |
| applications | calendar_events     | One-to-Many          |

## Attributes

| Column            | Type                    | Required | Description                               |
| ----------------- | ----------------------- | -------- | ----------------------------------------- |
| id                | UUID                    | Yes      | Application ID                            |
| user_id           | UUID                    | Yes      | Owner user                                |
| job_id            | UUID                    | No       | Related job (from Job Hunter save)        |
| job_match_id      | UUID                    | No       | Related fit score row                     |
| manual_job_title  | TEXT                    | Cond.    | Title when no `job_id` (Kanban manual)    |
| manual_company    | TEXT                    | No       | Company for manual applications           |
| manual_location   | TEXT                    | No       | Location for manual applications          |
| status            | application_status ENUM | Yes      | saved/applied/interviewing/offer/rejected |
| notes             | TEXT                    | No       | User notes                                |
| applied_at        | TIMESTAMPTZ             | No       | Set when status → `applied` (RPC)         |
| deadline          | DATE                    | No       | Application deadline (calendar synthesis) |
| created_at        | TIMESTAMPTZ             | Yes      | Creation time                             |
| updated_at        | TIMESTAMPTZ             | Yes      | Last update time                          |

### Constraints (migration `20250525153000`)

`applications_has_job_or_manual_title`: at least one of `job_id IS NOT NULL` OR non-blank `manual_job_title`.

### Status RPC

`change_application_status(p_application_id, p_user_id, p_new_status, p_note)` — `SECURITY DEFINER`, row lock, updates status, sets `applied_at` on first transition to `applied`, inserts `application_history` when status changes.

---

# Table: application_history

## Purpose

Stores Kanban status transition history.

## Responsible For

* Tracking application movement
* Audit history
* Dashboard insights

## Relationships

| From                | To           | Relationship |
| ------------------- | ------------ | ------------ |
| application_history | applications | Many-to-One  |

## Attributes

| Column         | Type                    | Required | Description        |
| -------------- | ----------------------- | -------- | ------------------ |
| id             | UUID                    | Yes      | History ID         |
| application_id | UUID                    | Yes      | Parent application |
| old_status     | application_status ENUM | No       | Previous status    |
| new_status     | application_status ENUM | Yes      | New status         |
| note           | TEXT                    | No       | Status change note |
| changed_at     | TIMESTAMPTZ             | Yes      | Change time        |

---

# Table: goals

## Purpose

Stores user career goals.

## Responsible For

* Goal setting
* Progress tracking
* AI reminders

## Relationships

| From  | To       | Relationship |
| ----- | -------- | ------------ |
| goals | profiles | Many-to-One  |
| goals | tasks    | One-to-Many  |

## Attributes

| Column      | Type             | Required | Description                       |
| ----------- | ---------------- | -------- | --------------------------------- |
| id          | UUID             | Yes      | Goal ID                           |
| user_id     | UUID             | Yes      | Owner user                        |
| title       | TEXT             | Yes      | Goal title                        |
| description | TEXT             | No       | Goal details                      |
| status      | goal_status ENUM | Yes      | active/completed/paused/cancelled |
| target_date | DATE             | No       | Target completion date            |
| created_at  | TIMESTAMPTZ      | Yes      | Creation time                     |
| updated_at  | TIMESTAMPTZ      | Yes      | Last update time                  |

---

# Table: tasks

## Purpose

Stores to-do items.

## Responsible For

* Daily/weekly tasks
* Roadmap-linked tasks
* Application-linked tasks
* Dashboard productivity metrics

## Relationships

| From  | To              | Relationship         |
| ----- | --------------- | -------------------- |
| tasks | profiles        | Many-to-One          |
| tasks | goals           | Many-to-One optional |
| tasks | roadmap_items   | Many-to-One optional |
| tasks | applications    | Many-to-One optional |
| tasks | calendar_events | One-to-Many          |

## Attributes

| Column          | Type             | Required | Description                     |
| --------------- | ---------------- | -------- | ------------------------------- |
| id              | UUID             | Yes      | Task ID                         |
| user_id         | UUID             | Yes      | Owner user                      |
| goal_id         | UUID             | No       | Related goal                    |
| roadmap_item_id | UUID             | No       | Related roadmap item            |
| application_id  | UUID             | No       | Related application             |
| title           | TEXT             | Yes      | Task title                      |
| description     | TEXT             | No       | Task details                    |
| status          | task_status ENUM | Yes      | todo/in_progress/done/cancelled |
| priority        | INTEGER          | Yes      | 1 (high) – 3 (low); check `tasks_priority_range` |
| due_date        | DATE             | No       | Due date                        |
| completed_at    | TIMESTAMPTZ      | No       | Completion time                 |
| created_at      | TIMESTAMPTZ      | Yes      | Creation time                   |
| updated_at      | TIMESTAMPTZ      | Yes      | Last update time                |

---

# Table: calendar_events

## Purpose

Stores calendar events and reminders.

## Responsible For

* Deadlines
* Interviews
* Study events
* AI reminders
* Calendar view

## Relationships

| From            | To           | Relationship         |
| --------------- | ------------ | -------------------- |
| calendar_events | profiles     | Many-to-One          |
| calendar_events | tasks        | Many-to-One optional |
| calendar_events | applications | Many-to-One optional |

## Attributes

| Column         | Type            | Required | Description                                          |
| -------------- | --------------- | -------- | ---------------------------------------------------- |
| id             | UUID            | Yes      | Event ID                                             |
| user_id        | UUID            | Yes      | Owner user                                           |
| task_id        | UUID            | No       | Related task                                         |
| application_id | UUID            | No       | Related application                                  |
| title          | TEXT            | Yes      | Event title                                          |
| description    | TEXT            | No       | Event details                                        |
| event_type     | event_type ENUM | Yes      | deadline/interview/reminder/study/application/custom |
| start_time     | TIMESTAMPTZ     | Yes      | Event start time                                     |
| end_time       | TIMESTAMPTZ     | No       | Event end time                                       |
| reminder_time  | TIMESTAMPTZ     | No       | Reminder time                                        |
| created_at     | TIMESTAMPTZ     | Yes      | Creation time                                        |
| updated_at     | TIMESTAMPTZ     | Yes      | Last update time                                     |

---

# Table: skill_gap_analysis

> **Implementation:** Schema + RLS only. Chat intent `skill_gap` is detected but results are not persisted to this table yet.

## Purpose

Stores AI-generated readiness and missing skill analysis.

## Responsible For

* Readiness check
* Missing skills
* Career recommendations
* Roadmap input

## Relationships

| From               | To       | Relationship         |
| ------------------ | -------- | -------------------- |
| skill_gap_analysis | profiles | Many-to-One          |
| skill_gap_analysis | resumes  | Many-to-One optional |
| skill_gap_analysis | jobs     | Many-to-One optional |

## Attributes

| Column          | Type        | Required | Description              |
| --------------- | ----------- | -------- | ------------------------ |
| id              | UUID        | Yes      | Analysis ID              |
| user_id         | UUID        | Yes      | Owner user               |
| resume_id       | UUID        | No       | Resume used for analysis |
| job_id          | UUID        | No       | Job used for analysis    |
| target_role     | TEXT        | No       | Target role              |
| current_skills  | TEXT[]      | No       | Current detected skills  |
| required_skills | TEXT[]      | No       | Required skills          |
| missing_skills  | TEXT[]      | No       | Missing skills           |
| recommendations | JSONB       | No       | Learning recommendations |
| created_at      | TIMESTAMPTZ | Yes      | Creation time            |

---

# Cross-Module Integration

## Member 1 → Member 2

Member 2 uses Member 1 data for fit scoring.

```text
resume_chunks + user_skills
        ↓
job_matches
```

Example:

A job requires Python, FastAPI, SQL.
Member 2 checks user_skills and resume_chunks to compute match score.

---

## Member 1 → Member 3

Member 3 uses resume_chunks for AI-grounded responses.

```text
resume_chunks
        ↓
assistant_messages.used_resume_chunks
```

Example:

User asks: "Am I ready for this data engineer role?"
Assistant retrieves resume_chunks and uses them as evidence.

---

## Member 2 → Member 3

Member 3 uses jobs and job_matches for tracking, cover letters, and assistant responses.

```text
jobs + job_matches
        ↓
applications / cover_letters / assistant_messages
```

Example:

A matched job can be saved into Kanban and used for cover letter generation.

---

## Member 3 → Dashboard

Dashboard reads from:

```text
applications
roadmaps
roadmap_items
tasks
goals
calendar_events
```

Example metrics:

* jobs applied
* roadmap progress
* tasks completed
* upcoming deadlines
* active applications

---

# Feature-to-Owner Mapping (with implementation status)

| Feature | Owner | Tables | Status |
| --- | --- | --- | --- |
| CV Upload | M1 | `resumes` | **Live** — FastAPI `POST /resumes/upload` |
| PDF/DOCX Parsing | M1 | `resumes`, `resume_sections` | **Live** — pypdf / python-docx |
| Chunking | M1 | `resume_chunks` | **Live** — 900 chars, 150 overlap |
| Embeddings | M1 | `resume_chunks` | **Live** — Gemini provider, 768-dim target |
| RAG Retrieval | M1 | `resume_chunks` | **Live** — RPC + numpy fallback |
| AI CV Q&A | M1 | `resume_chunks` | **Live** — `/resumes/answer` + Gemini |
| Skill Extraction | M1 | `user_skills` | **Live** — Gemini + regex fallback |
| Job Search (JSearch) | M2 | `job_searches`, `jobs` | **Live** — RapidAPI |
| Manual job paste | M2 | `jobs`, `job_matches` | **API only** — no `/jobs` form UI |
| Fit Score | M2 | `job_matches`, `user_skills`, `resume_chunks` | **Live** — `job_scorer` |
| Save to Kanban | M2→M3 | `applications` | **Live** — `POST …/matches/{id}/save` |
| AI Chat | M3 | `assistant_*` | **Live** — Next.js route, Gemini stream |
| Cover Letter | M3 | `cover_letters` | **Schema only** — chat intent metadata |
| Roadmap | M3 | `roadmaps`, `roadmap_items` | **Schema only** |
| Skill gap | M3 | `skill_gap_analysis` | **Schema only** |
| Calendar | M3 | `calendar_events` | **Live** — Supabase client |
| Kanban Board | M3 | `applications`, `application_history` | **Live** |
| Goals & tasks | M3 | `goals`, `tasks` | **Live** — FastAPI + Supabase tasks |
| Standalone tasks | M3 | `tasks` (`goal_id` null) | **Live** — Supabase only |
| Evaluation Suite | Shared | `evaluation_tests` | **Schema** |

---

# Enums (Postgres types)

| Enum | Values |
| --- | --- |
| `resume_status` | `uploaded`, `processing`, `processed`, `failed` |
| `application_status` | `saved`, `applied`, `interviewing`, `offer`, `rejected` |
| `task_status` | `todo`, `in_progress`, `done`, `cancelled` |
| `goal_status` | `active`, `completed`, `paused`, `cancelled` |
| `message_role` | `user`, `assistant`, `system` |
| `event_type` | `deadline`, `interview`, `reminder`, `study`, `application`, `custom` |

---

# Migrations & Grants

Applied in order under `supabase/migrations/`:

| File | What it adds |
| --- | --- |
| `20250525000001_initial_schema.sql` | All tables, enums, indexes, RLS, `handle_new_user`, `update_updated_at_column` triggers |
| `20250525153000_kanban_manual_applications.sql` | `manual_*` columns, check constraint, `change_application_status`, grants |
| `20250525170000_goals_tasks_priority.sql` | `tasks_priority_range` check (1–3), grants |
| `20250526001000_goals_tasks_grants.sql` | Duplicate-safe grants for goals/tasks |
| `20250526003000_calendar_grants.sql` | `calendar_events` CRUD; `jobs` SELECT for linked display |
| `20250526005000_assistant_conversation_grants.sql` | Assistant tables grants |
| `20250526120000_resume_cv_grants.sql` | Resume module grants (fixes SQLSTATE `42501`) |
| `20250527000000_match_resume_chunks_rpc.sql` | pgvector similarity functions |
| `20260528000000_job_intelligence_grants.sql` | Job module grants |

**Alembic** (direct `DATABASE_URL`, not Supabase CLI):

| Revision | What it adds |
| --- | --- |
| `2b7f66d7a1b2_gemini_embedding_dimension_upgrade` | `resume_chunks.embedding_new vector(N)` + IVFFlat index |

---

# Database Functions & Triggers

| Name | Type | Purpose |
| --- | --- | --- |
| `handle_new_user()` | trigger on `auth.users` | Inserts `profiles` row on signup |
| `update_updated_at_column()` | trigger | Sets `updated_at = now()` on profiles, resumes, applications, assistant_conversations, cover_letters, roadmaps, goals, tasks, calendar_events |
| `change_application_status(...)` | RPC | Atomic Kanban status + history |
| `match_resume_chunks(...)` | RPC | Top-k chunk search by cosine similarity |
| `match_resume_chunks_with_resume(...)` | RPC | Same, scoped to one `resume_id` |

---

# Row Level Security (summary)

RLS is **enabled on all application tables**. Typical pattern:

- **User-owned rows:** `auth.uid() = user_id` for SELECT/INSERT/UPDATE/DELETE
- **`jobs`:** SELECT for any authenticated user; INSERT/UPDATE/DELETE for `service_role` only (backend ingests listings)
- **`application_history`:** SELECT/INSERT allowed when parent `applications.user_id = auth.uid()`
- **`evaluation_tests`:** SELECT for authenticated; full access for `service_role`

Backend FastAPI uses the **service role** and must mirror ownership in Python (`.eq("user_id", user_id)`).

---

# Cross-Module Data Flows (as implemented)

## CV → Job fit score

```
user_skills (names) + resume_chunks (semantic similarity to JD text)
        ↓
job_matches.fit_score, matched_skills[], missing_skills[], evidence_chunks[]
```

## Job match → Kanban

```
job_matches.id
        ↓
applications (status=saved, job_id, job_match_id)
        ↓
application_history (on status RPC)
```

## CV → Assistant (partial)

```
assistant_messages.used_resume_chunks[]  — populated from chat route metadata
assistant_messages.metadata              — intent, model, can_save_* flags
```

**Gap:** `getResumeContext()` in the frontend still uses static `mockCV` instead of live `resume_chunks` / `raw_text`.

---

# Recommended Supabase SQL Schema

```sql
create extension if not exists "pgcrypto";
create extension if not exists "vector";

create type resume_status as enum (
  'uploaded',
  'processing',
  'processed',
  'failed'
);

create type application_status as enum (
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected'
);

create type task_status as enum (
  'todo',
  'in_progress',
  'done',
  'cancelled'
);

create type goal_status as enum (
  'active',
  'completed',
  'paused',
  'cancelled'
);

create type message_role as enum (
  'user',
  'assistant',
  'system'
);

create type event_type as enum (
  'deadline',
  'interview',
  'reminder',
  'study',
  'application',
  'custom'
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  avatar_url text,
  target_role text,
  location text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_url text,
  raw_text text,
  parsed_summary jsonb,
  status resume_status default 'uploaded',
  is_active boolean default true,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table resume_sections (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references resumes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  section_name text not null,
  section_order int default 0,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table resume_chunks (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references resumes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  section_id uuid references resume_sections(id) on delete set null,
  section_name text,
  chunk_index int not null,
  chunk_text text not null,
  token_count int,
  embedding vector(384),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  resume_id uuid references resumes(id) on delete set null,
  skill_name text not null,
  category text,
  proficiency text,
  evidence text,
  source text default 'resume',
  created_at timestamptz default now(),
  unique(user_id, skill_name)
);

create table job_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  query text not null,
  location text,
  filters jsonb default '{}'::jsonb,
  source text,
  created_at timestamptz default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  search_id uuid references job_searches(id) on delete set null,
  title text not null,
  company text,
  location text,
  salary_range text,
  job_type text,
  deadline date,
  description text,
  requirements text,
  source text,
  source_url text,
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  resume_id uuid references resumes(id) on delete set null,
  job_id uuid not null references jobs(id) on delete cascade,
  fit_score numeric(5,2) not null,
  matched_skills text[],
  missing_skills text[],
  explanation text,
  evidence_chunks uuid[],
  created_at timestamptz default now(),
  unique(user_id, job_id, resume_id)
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  job_match_id uuid references job_matches(id) on delete set null,
  manual_job_title text,
  manual_company text,
  manual_location text,
  status application_status default 'saved',
  notes text,
  applied_at timestamptz,
  deadline date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint applications_has_job_or_manual_title check (
    job_id is not null or nullif(btrim(manual_job_title), '') is not null
  )
);

create table application_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  old_status application_status,
  new_status application_status not null,
  note text,
  changed_at timestamptz default now()
);

create table assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text,
  context jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references assistant_conversations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role message_role not null,
  content text not null,
  used_resume_chunks uuid[],
  used_job_id uuid references jobs(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  resume_id uuid references resumes(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  title text,
  content text not null,
  version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  target_role text not null,
  duration_weeks int,
  overview text,
  progress_percent numeric(5,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table roadmap_items (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references roadmaps(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  week_number int,
  title text not null,
  description text,
  resources jsonb default '[]'::jsonb,
  status task_status default 'todo',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  status goal_status default 'active',
  target_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  goal_id uuid references goals(id) on delete set null,
  roadmap_item_id uuid references roadmap_items(id) on delete set null,
  application_id uuid references applications(id) on delete set null,
  title text not null,
  description text,
  status task_status default 'todo',
  priority int default 2,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  application_id uuid references applications(id) on delete set null,
  title text not null,
  description text,
  event_type event_type default 'custom',
  start_time timestamptz not null,
  end_time timestamptz,
  reminder_time timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table skill_gap_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  resume_id uuid references resumes(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  target_role text,
  current_skills text[],
  required_skills text[],
  missing_skills text[],
  recommendations jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table evaluation_tests (
  id uuid primary key default gen_random_uuid(),
  feature_name text not null,
  input_data jsonb not null,
  expected_output text,
  actual_output text,
  passed boolean,
  notes text,
  created_at timestamptz default now()
);
```

---

# Indexes

```sql
create index idx_resumes_user_id on resumes(user_id);
create index idx_resume_sections_resume_id on resume_sections(resume_id);
create index idx_resume_chunks_resume_id on resume_chunks(resume_id);
create index idx_resume_chunks_user_id on resume_chunks(user_id);

create index idx_jobs_title on jobs(title);
create index idx_jobs_company on jobs(company);
create index idx_job_matches_user_id on job_matches(user_id);
create index idx_applications_user_id on applications(user_id);
create index idx_applications_status on applications(status);

create index idx_messages_conversation_id on assistant_messages(conversation_id);
create index idx_tasks_user_id on tasks(user_id);
create index idx_tasks_status on tasks(status);
create index idx_calendar_user_id on calendar_events(user_id);

create index idx_resume_chunks_embedding
on resume_chunks
using ivfflat (embedding vector_cosine_ops);

-- Alembic (optional Gemini 768-dim rollout):
-- alter table resume_chunks add column embedding_new vector(768);
-- create index idx_resume_chunks_embedding_new on resume_chunks
--   using ivfflat (embedding_new vector_cosine_ops);
```

> **Note:** The SQL appendix above is a condensed reference. For the full deployed schema including RLS policies and all indexes, use `supabase/migrations/20250525000001_initial_schema.sql` plus subsequent migration files.

---

# Development Order (historical → current)

All core tables from the initial migration are **created**. Recommended **remaining work** by dependency:

```text
1. Align embedding dimension: RPC vector(N) = active column = Gemini output
2. Wire assistant getResumeContext() → live resume_chunks / raw_text
3. Persist cover_letters, roadmaps, skill_gap_analysis from chat intents
4. Optional: Supabase Storage for resumes.file_url
5. Optional: unique (source, source_url) on jobs to dedupe JSearch repeats
```

### Module ownership (unchanged)

```text
Member 1 = CV Intelligence     (resumes, resume_sections, resume_chunks, user_skills)
Member 2 = Job Intelligence    (job_searches, jobs, job_matches)
Member 3 = Career Assistant    (applications, goals, tasks, calendar, assistant_*, roadmaps, cover_letters, skill_gap)
Shared     = profiles, evaluation_tests
```

---

# Related Documentation

| Document | Purpose |
| --- | --- |
| [`present-state.md`](present-state.md) | Full-stack feature status, API list, env vars |
| [`cv-intelligence-implementation.md`](cv-intelligence-implementation.md) | CV pipeline and retrieval details |
| [`../supabase/migrations/`](../supabase/migrations/) | Applied DDL source of truth |
| [`../backend/alembic/versions/`](../backend/alembic/versions/) | `embedding_new` column migration |

---

# Design Principles

1. **One user row (`profiles`)** anchors all modules via `user_id` foreign keys.
2. **Service role for ingestion** (CV parse, job search) — RLS alone is insufficient without table GRANTs.
3. **Evidence arrays** (`job_matches.evidence_chunks`, `assistant_messages.used_resume_chunks`) reference `resume_chunks.id` for traceability.
4. **Kanban history is append-only** — status changes go through RPC, not ad-hoc updates without history.
5. **Schema-first placeholders** (`cover_letters`, `roadmaps`, `skill_gap_analysis`) allow parallel frontend/backend work without blocking MVP tables.
