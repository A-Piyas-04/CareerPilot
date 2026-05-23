# CareerPilot — Complete Database Schema Documentation

## Overview

This document defines the complete production-ready database schema for the CareerPilot platform.

The schema is designed to support:

* CV Upload & Resume Intelligence
* RAG-based AI Context Retrieval
* Job Hunting & Fit Scoring
* AI Assistant Memory
* Cover Letter Generation
* Skill Gap Analysis
* Productivity Tracking
* Goal Management
* Kanban Application Tracking
* Calendar & To-Do System
* Dashboard Analytics
* Evaluation Suite

The architecture is designed for:

* Scalability
* Future feature expansion
* AI grounding
* Modular development
* Multi-user support
* Explainable AI outputs

---

# Database Technology

## Primary Database

* Supabase PostgreSQL
* pgvector extension enabled

## Vector Search

* pgvector
* cosine similarity search

## Authentication

* Supabase Auth

---

# High-Level Module Architecture

```text
profiles
 ├── resumes
 │    ├── resume_sections
 │    └── resume_chunks
 │
 ├── user_skills
 │
 ├── job_searches
 │    └── jobs
 │         ├── job_matches
 │         └── applications
 │
 ├── assistant_conversations
 │    └── assistant_messages
 │
 ├── cover_letters
 │
 ├── roadmaps
 │    └── roadmap_items
 │
 ├── goals
 │    └── tasks
 │
 ├── calendar_events
 │
 ├── skill_gap_analysis
 │
 └── evaluation_tests
```

---

# Module 1 — User & Profile System

## Purpose

Responsible for:

* User identity
* Authentication linkage
* Global user metadata
* Personalization
* Role targeting

---

# Table: profiles

## Description

Stores the primary user profile.

Connected directly with Supabase Auth.

## Relationships

| Relationship                       | Type        |
| ---------------------------------- | ----------- |
| profiles → resumes                 | One-to-Many |
| profiles → jobs                    | Indirect    |
| profiles → applications            | One-to-Many |
| profiles → assistant_conversations | One-to-Many |
| profiles → goals                   | One-to-Many |
| profiles → tasks                   | One-to-Many |

---

## Attributes

| Column      | Type        | Description                            |
| ----------- | ----------- | -------------------------------------- |
| id          | UUID        | Primary key. References auth.users(id) |
| full_name   | TEXT        | User full name                         |
| email       | TEXT        | Unique email address                   |
| avatar_url  | TEXT        | Profile image URL                      |
| target_role | TEXT        | Desired career role                    |
| location    | TEXT        | User location                          |
| bio         | TEXT        | User bio/summary                       |
| created_at  | TIMESTAMPTZ | Creation timestamp                     |
| updated_at  | TIMESTAMPTZ | Last update timestamp                  |

---

# Module 2 — Resume Intelligence / RAG Core

## Purpose

Responsible for:

* CV upload
* Resume parsing
* Section extraction
* Chunking
* Embeddings
* Semantic retrieval
* AI grounding

This is the core intelligence module.

---

# Table: resumes

## Description

Stores uploaded resume metadata and parsed raw text.

## Relationships

| Relationship              | Type        |
| ------------------------- | ----------- |
| resumes → resume_sections | One-to-Many |
| resumes → resume_chunks   | One-to-Many |
| resumes → user_skills     | One-to-Many |
| resumes → job_matches     | One-to-Many |
| resumes → cover_letters   | One-to-Many |

---

## Attributes

| Column         | Type        | Description                          |
| -------------- | ----------- | ------------------------------------ |
| id             | UUID        | Resume ID                            |
| user_id        | UUID        | References profiles(id)              |
| file_name      | TEXT        | Original uploaded filename           |
| file_type      | TEXT        | PDF/DOCX                             |
| file_url       | TEXT        | Storage location                     |
| raw_text       | TEXT        | Entire extracted resume text         |
| parsed_summary | JSONB       | Structured parsed summary            |
| status         | ENUM        | uploaded/processing/processed/failed |
| is_active      | BOOLEAN     | Whether resume is active             |
| error_message  | TEXT        | Processing failure reason            |
| created_at     | TIMESTAMPTZ | Upload time                          |
| updated_at     | TIMESTAMPTZ | Last update                          |

---

# Table: resume_sections

## Description

Stores semantic resume sections.

Example sections:

* education
* skills
* experience
* projects
* certifications

## Relationships

| Relationship                    | Type        |
| ------------------------------- | ----------- |
| resume_sections → resumes       | Many-to-One |
| resume_sections → resume_chunks | One-to-Many |

---

## Attributes

| Column        | Type        | Description             |
| ------------- | ----------- | ----------------------- |
| id            | UUID        | Section ID              |
| resume_id     | UUID        | References resumes(id)  |
| user_id       | UUID        | References profiles(id) |
| section_name  | TEXT        | Name of section         |
| section_order | INTEGER     | Display ordering        |
| content       | TEXT        | Full section text       |
| metadata      | JSONB       | Extra parsing metadata  |
| created_at    | TIMESTAMPTZ | Creation time           |

---

# Table: resume_chunks

## Description

Stores semantic chunks for vector retrieval.

This table powers:

* RAG retrieval
* Job matching
* Skill extraction
* AI assistant grounding

## Relationships

| Relationship                       | Type        |
| ---------------------------------- | ----------- |
| resume_chunks → resumes            | Many-to-One |
| resume_chunks → resume_sections    | Many-to-One |
| resume_chunks → assistant_messages | Referenced  |
| resume_chunks → job_matches        | Referenced  |

---

## Attributes

| Column       | Type        | Description                    |
| ------------ | ----------- | ------------------------------ |
| id           | UUID        | Chunk ID                       |
| resume_id    | UUID        | References resumes(id)         |
| user_id      | UUID        | References profiles(id)        |
| section_id   | UUID        | References resume_sections(id) |
| section_name | TEXT        | Section label                  |
| chunk_index  | INTEGER     | Chunk ordering                 |
| chunk_text   | TEXT        | Chunk content                  |
| token_count  | INTEGER     | Token size                     |
| embedding    | VECTOR(384) | Semantic embedding vector      |
| metadata     | JSONB       | Extra metadata                 |
| created_at   | TIMESTAMPTZ | Creation time                  |

---

# Module 3 — Skills System

## Purpose

Responsible for:

* Skill extraction
* Skill tracking
* Fit score reasoning
* Gap analysis

---

# Table: user_skills

## Description

Stores structured skills extracted from resume or user input.

## Relationships

| Relationship           | Type        |
| ---------------------- | ----------- |
| user_skills → profiles | Many-to-One |
| user_skills → resumes  | Many-to-One |

---

## Attributes

| Column      | Type        | Description             |
| ----------- | ----------- | ----------------------- |
| id          | UUID        | Skill ID                |
| user_id     | UUID        | References profiles(id) |
| resume_id   | UUID        | Source resume           |
| skill_name  | TEXT        | Skill name              |
| category    | TEXT        | Skill category          |
| proficiency | TEXT        | Skill level             |
| evidence    | TEXT        | Evidence from resume    |
| source      | TEXT        | resume/manual/AI        |
| created_at  | TIMESTAMPTZ | Creation time           |

---

# Module 4 — Job Hunter System

## Purpose

Responsible for:

* Job searching
* External APIs/scraping
* Structured job cards
* Fit scoring
* Match reasoning

---

# Table: job_searches

## Description

Stores user job search queries.

## Relationships

| Relationship        | Type        |
| ------------------- | ----------- |
| job_searches → jobs | One-to-Many |

---

## Attributes

| Column     | Type        | Description             |
| ---------- | ----------- | ----------------------- |
| id         | UUID        | Search ID               |
| user_id    | UUID        | References profiles(id) |
| query      | TEXT        | Search query            |
| location   | TEXT        | Search location         |
| filters    | JSONB       | Additional filters      |
| source     | TEXT        | API/source name         |
| created_at | TIMESTAMPTZ | Search timestamp        |

---

# Table: jobs

## Description

Stores normalized job posting data.

## Relationships

| Relationship         | Type        |
| -------------------- | ----------- |
| jobs → job_matches   | One-to-Many |
| jobs → applications  | One-to-Many |
| jobs → cover_letters | One-to-Many |

---

## Attributes

| Column       | Type        | Description                 |
| ------------ | ----------- | --------------------------- |
| id           | UUID        | Job ID                      |
| search_id    | UUID        | References job_searches(id) |
| title        | TEXT        | Job title                   |
| company      | TEXT        | Company name                |
| location     | TEXT        | Job location                |
| salary_range | TEXT        | Salary info                 |
| job_type     | TEXT        | Full-time/internship/etc    |
| deadline     | DATE        | Application deadline        |
| description  | TEXT        | Job description             |
| requirements | TEXT        | Job requirements            |
| source       | TEXT        | Job source                  |
| source_url   | TEXT        | Original posting URL        |
| raw_data     | JSONB       | Original API data           |
| created_at   | TIMESTAMPTZ | Creation time               |

---

# Table: job_matches

## Description

Stores computed fit scores between user resume and job.

This powers:

* Match percentage
* Match reasoning
* Missing skills
* Explainability

## Relationships

| Relationship               | Type                |
| -------------------------- | ------------------- |
| job_matches → jobs         | Many-to-One         |
| job_matches → resumes      | Many-to-One         |
| job_matches → applications | One-to-One/Optional |

---

## Attributes

| Column          | Type        | Description              |
| --------------- | ----------- | ------------------------ |
| id              | UUID        | Match ID                 |
| user_id         | UUID        | References profiles(id)  |
| resume_id       | UUID        | References resumes(id)   |
| job_id          | UUID        | References jobs(id)      |
| fit_score       | NUMERIC     | Match percentage         |
| matched_skills  | TEXT[]      | Skills matched           |
| missing_skills  | TEXT[]      | Missing skills           |
| explanation     | TEXT        | Match reasoning          |
| evidence_chunks | UUID[]      | Supporting resume chunks |
| created_at      | TIMESTAMPTZ | Creation time            |

---

# Module 5 — Application Tracker / Kanban

## Purpose

Responsible for:

* Application tracking
* Kanban workflow
* Job pipeline history

---

# Table: applications

## Description

Stores user job application pipeline.

Kanban states:

* saved
* applied
* interviewing
* offer
* rejected

## Relationships

| Relationship                       | Type        |
| ---------------------------------- | ----------- |
| applications → jobs                | Many-to-One |
| applications → job_matches         | Many-to-One |
| applications → application_history | One-to-Many |
| applications → tasks               | One-to-Many |

---

## Attributes

| Column       | Type        | Description                |
| ------------ | ----------- | -------------------------- |
| id           | UUID        | Application ID             |
| user_id      | UUID        | References profiles(id)    |
| job_id       | UUID        | References jobs(id)        |
| job_match_id | UUID        | References job_matches(id) |
| status       | ENUM        | Kanban status              |
| notes        | TEXT        | User notes                 |
| applied_at   | TIMESTAMPTZ | Apply timestamp            |
| deadline     | DATE        | Application deadline       |
| created_at   | TIMESTAMPTZ | Creation time              |
| updated_at   | TIMESTAMPTZ | Last update                |

---

# Table: application_history

## Description

Tracks Kanban status transitions.

## Relationships

| Relationship                       | Type        |
| ---------------------------------- | ----------- |
| application_history → applications | Many-to-One |

---

## Attributes

| Column         | Type        | Description                 |
| -------------- | ----------- | --------------------------- |
| id             | UUID        | History ID                  |
| application_id | UUID        | References applications(id) |
| old_status     | ENUM        | Previous status             |
| new_status     | ENUM        | New status                  |
| note           | TEXT        | Transition note             |
| changed_at     | TIMESTAMPTZ | Change timestamp            |

---

# Module 6 — AI Assistant Memory

## Purpose

Responsible for:

* Conversational memory
* Chat history
* Context persistence
* RAG evidence tracking

---

# Table: assistant_conversations

## Description

Stores AI chat sessions.

## Relationships

| Relationship                                 | Type        |
| -------------------------------------------- | ----------- |
| assistant_conversations → assistant_messages | One-to-Many |

---

## Attributes

| Column     | Type        | Description             |
| ---------- | ----------- | ----------------------- |
| id         | UUID        | Conversation ID         |
| user_id    | UUID        | References profiles(id) |
| title      | TEXT        | Conversation title      |
| context    | JSONB       | Conversation metadata   |
| created_at | TIMESTAMPTZ | Creation time           |
| updated_at | TIMESTAMPTZ | Last update             |

---

# Table: assistant_messages

## Description

Stores individual AI conversation messages.

Supports:

* memory
* explainability
* context tracing

## Relationships

| Relationship                                 | Type        |
| -------------------------------------------- | ----------- |
| assistant_messages → assistant_conversations | Many-to-One |
| assistant_messages → jobs                    | Optional    |
| assistant_messages → resume_chunks           | Referenced  |

---

## Attributes

| Column             | Type        | Description                            |
| ------------------ | ----------- | -------------------------------------- |
| id                 | UUID        | Message ID                             |
| conversation_id    | UUID        | References assistant_conversations(id) |
| user_id            | UUID        | References profiles(id)                |
| role               | ENUM        | user/assistant/system                  |
| content            | TEXT        | Message content                        |
| used_resume_chunks | UUID[]      | Grounding chunks                       |
| used_job_id        | UUID        | Related job                            |
| metadata           | JSONB       | Extra metadata                         |
| created_at         | TIMESTAMPTZ | Creation time                          |

---

# Module 7 — Cover Letter System

## Purpose

Responsible for:

* AI-generated personalized cover letters
* Version tracking

---

# Table: cover_letters

## Description

Stores generated cover letters.

## Relationships

| Relationship            | Type        |
| ----------------------- | ----------- |
| cover_letters → resumes | Many-to-One |
| cover_letters → jobs    | Many-to-One |

---

## Attributes

| Column     | Type        | Description             |
| ---------- | ----------- | ----------------------- |
| id         | UUID        | Cover letter ID         |
| user_id    | UUID        | References profiles(id) |
| resume_id  | UUID        | Source resume           |
| job_id     | UUID        | Related job             |
| title      | TEXT        | Letter title            |
| content    | TEXT        | Letter body             |
| version    | INTEGER     | Version number          |
| created_at | TIMESTAMPTZ | Creation time           |
| updated_at | TIMESTAMPTZ | Last update             |

---

# Module 8 — Roadmap System

## Purpose

Responsible for:

* Learning roadmaps
* Weekly planning
* Progress tracking

---

# Table: roadmaps

## Description

Stores AI-generated learning roadmaps.

## Relationships

| Relationship             | Type        |
| ------------------------ | ----------- |
| roadmaps → roadmap_items | One-to-Many |

---

## Attributes

| Column           | Type        | Description             |
| ---------------- | ----------- | ----------------------- |
| id               | UUID        | Roadmap ID              |
| user_id          | UUID        | References profiles(id) |
| target_role      | TEXT        | Desired role            |
| duration_weeks   | INTEGER     | Roadmap duration        |
| overview         | TEXT        | Summary                 |
| progress_percent | NUMERIC     | Completion percentage   |
| created_at       | TIMESTAMPTZ | Creation time           |
| updated_at       | TIMESTAMPTZ | Last update             |

---

# Table: roadmap_items

## Description

Stores individual roadmap steps.

## Relationships

| Relationship             | Type        |
| ------------------------ | ----------- |
| roadmap_items → roadmaps | Many-to-One |
| roadmap_items → tasks    | One-to-Many |

---

## Attributes

| Column       | Type        | Description             |
| ------------ | ----------- | ----------------------- |
| id           | UUID        | Item ID                 |
| roadmap_id   | UUID        | References roadmaps(id) |
| user_id      | UUID        | References profiles(id) |
| week_number  | INTEGER     | Week number             |
| title        | TEXT        | Item title              |
| description  | TEXT        | Item description        |
| resources    | JSONB       | Learning resources      |
| status       | ENUM        | Task status             |
| due_date     | DATE        | Due date                |
| completed_at | TIMESTAMPTZ | Completion timestamp    |
| created_at   | TIMESTAMPTZ | Creation time           |

---

# Module 9 — Goals / Tasks / Productivity

## Purpose

Responsible for:

* Productivity tracking
* Goal management
* To-do system
* Progress monitoring

---

# Table: goals

## Description

Stores high-level user goals.

## Relationships

| Relationship  | Type        |
| ------------- | ----------- |
| goals → tasks | One-to-Many |

---

## Attributes

| Column      | Type        | Description             |
| ----------- | ----------- | ----------------------- |
| id          | UUID        | Goal ID                 |
| user_id     | UUID        | References profiles(id) |
| title       | TEXT        | Goal title              |
| description | TEXT        | Goal details            |
| status      | ENUM        | Goal state              |
| target_date | DATE        | Completion target       |
| created_at  | TIMESTAMPTZ | Creation time           |
| updated_at  | TIMESTAMPTZ | Last update             |

---

# Table: tasks

## Description

Stores productivity tasks and to-do items.

## Relationships

| Relationship            | Type        |
| ----------------------- | ----------- |
| tasks → goals           | Many-to-One |
| tasks → roadmap_items   | Many-to-One |
| tasks → applications    | Many-to-One |
| tasks → calendar_events | One-to-Many |

---

## Attributes

| Column          | Type        | Description             |
| --------------- | ----------- | ----------------------- |
| id              | UUID        | Task ID                 |
| user_id         | UUID        | References profiles(id) |
| goal_id         | UUID        | Related goal            |
| roadmap_item_id | UUID        | Related roadmap item    |
| application_id  | UUID        | Related application     |
| title           | TEXT        | Task title              |
| description     | TEXT        | Task details            |
| status          | ENUM        | Task state              |
| priority        | INTEGER     | Task priority           |
| due_date        | DATE        | Due date                |
| completed_at    | TIMESTAMPTZ | Completion time         |
| created_at      | TIMESTAMPTZ | Creation time           |
| updated_at      | TIMESTAMPTZ | Last update             |

---

# Module 10 — Calendar System

## Purpose

Responsible for:

* Interview schedules
* Deadlines
* Reminders
* Study plans

---

# Table: calendar_events

## Description

Stores calendar scheduling information.

## Relationships

| Relationship                   | Type        |
| ------------------------------ | ----------- |
| calendar_events → tasks        | Many-to-One |
| calendar_events → applications | Many-to-One |

---

## Attributes

| Column         | Type        | Description             |
| -------------- | ----------- | ----------------------- |
| id             | UUID        | Event ID                |
| user_id        | UUID        | References profiles(id) |
| task_id        | UUID        | Related task            |
| application_id | UUID        | Related application     |
| title          | TEXT        | Event title             |
| description    | TEXT        | Event details           |
| event_type     | ENUM        | Event category          |
| start_time     | TIMESTAMPTZ | Event start             |
| end_time       | TIMESTAMPTZ | Event end               |
| reminder_time  | TIMESTAMPTZ | Reminder timestamp      |
| created_at     | TIMESTAMPTZ | Creation time           |
| updated_at     | TIMESTAMPTZ | Last update             |

---

# Module 11 — Skill Gap Analysis

## Purpose

Responsible for:

* Missing skill detection
* Learning recommendations
* AI readiness evaluation

---

# Table: skill_gap_analysis

## Description

Stores AI-generated skill gap analysis.

## Relationships

| Relationship                 | Type        |
| ---------------------------- | ----------- |
| skill_gap_analysis → resumes | Many-to-One |
| skill_gap_analysis → jobs    | Many-to-One |

---

## Attributes

| Column          | Type        | Description             |
| --------------- | ----------- | ----------------------- |
| id              | UUID        | Analysis ID             |
| user_id         | UUID        | References profiles(id) |
| resume_id       | UUID        | Source resume           |
| job_id          | UUID        | Related job             |
| target_role     | TEXT        | Target role             |
| current_skills  | TEXT[]      | Existing skills         |
| required_skills | TEXT[]      | Expected skills         |
| missing_skills  | TEXT[]      | Missing skills          |
| recommendations | JSONB       | Suggested learning      |
| created_at      | TIMESTAMPTZ | Creation time           |

---

# Module 12 — Evaluation Suite

## Purpose

Responsible for:

* Test case tracking
* Benchmarking
* Hackathon evaluation documentation

---

# Table: evaluation_tests

## Description

Stores evaluation and benchmark test cases.

## Relationships

| Relationship     | Type       |
| ---------------- | ---------- |
| evaluation_tests | Standalone |

---

## Attributes

| Column          | Type        | Description        |
| --------------- | ----------- | ------------------ |
| id              | UUID        | Test ID            |
| feature_name    | TEXT        | Feature under test |
| input_data      | JSONB       | Input test payload |
| expected_output | TEXT        | Expected result    |
| actual_output   | TEXT        | Actual result      |
| passed          | BOOLEAN     | Pass/fail status   |
| notes           | TEXT        | Additional notes   |
| created_at      | TIMESTAMPTZ | Creation time      |

---

# Important AI Grounding Relationships

## Resume Grounding

```text
assistant_messages.used_resume_chunks
    → references resume_chunks.id
```

This proves AI responses are grounded in actual CV data.

---

## Job Match Explainability

```text
job_matches.evidence_chunks
    → references resume_chunks.id
```

This allows the system to explain:

* why a job matches
* which resume parts support the match
* which skills were detected

---

# Vector Search Design

## Embedding Model

Recommended:

```text
sentence-transformers/all-MiniLM-L6-v2
```

Embedding size:

```text
384 dimensions
```

---

# Indexing Strategy

## Important Indexes

### Resume Retrieval

```sql
idx_resume_chunks_embedding
idx_resume_chunks_resume_id
idx_resume_chunks_user_id
```

### Job Matching

```sql
idx_job_matches_user_id
idx_jobs_title
idx_jobs_company
```

### Productivity

```sql
idx_tasks_status
idx_applications_status
```

---

# Feature-to-Table Mapping

| Feature                 | Main Tables                                 |
| ----------------------- | ------------------------------------------- |
| CV Upload               | resumes                                     |
| Resume Parsing          | resume_sections                             |
| RAG Retrieval           | resume_chunks                               |
| Job Search              | job_searches, jobs                          |
| Fit Score               | job_matches                                 |
| Skill Gap Analysis      | skill_gap_analysis                          |
| AI Assistant            | assistant_conversations, assistant_messages |
| Cover Letter Generation | cover_letters                               |
| Learning Roadmap        | roadmaps, roadmap_items                     |
| Goal Tracking           | goals                                       |
| To-Do System            | tasks                                       |
| Calendar                | calendar_events                             |
| Kanban Board            | applications                                |
| Dashboard Analytics     | applications, tasks, roadmaps               |
| Evaluation Suite        | evaluation_tests                            |

---

# Future Scalability Notes

## Designed For

* Multiple resumes per user
* Multiple conversations
* Multiple job sources
* Explainable AI
* Multi-session memory
* Vector search scaling
* Future analytics
* Fine-tuning datasets

---

# Recommended Development Order

## Phase 1

* profiles
* resumes
* resume_sections
* resume_chunks

## Phase 2

* jobs
* job_matches
* applications

## Phase 3

* assistant_conversations
* assistant_messages
* cover_letters

## Phase 4

* goals
* tasks
* calendar_events
* roadmaps

---

# Final Notes

This schema is intentionally modular.

Each team member can independently build features while maintaining clean integration.

The most critical architectural decision is grounding every AI response in:

```text
resume_chunks
```

This ensures:

* no hallucinated user profile
* explainable recommendations
* trustworthy AI responses
* alignment with hackathon requirements
