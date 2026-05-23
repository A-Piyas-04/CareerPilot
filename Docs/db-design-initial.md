# CareerPilot — Database Schema Documentation

## Purpose

This document defines the database schema for CareerPilot using the actual 3-member team structure.

The database is organized into:

1. Member 1 Module — CV Intelligence
2. Member 2 Module — Job Intelligence
3. Member 3 Module — Career Assistant & Tracker
4. Shared/Core Module — Users, Evaluation, and System Support

The goal is to keep the schema simple for team development while still making it future-proof and easy to integrate.

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
| embedding    | VECTOR(384) | No       | Vector embedding for semantic search           |
| metadata     | JSONB       | No       | Extra chunk metadata                           |
| created_at   | TIMESTAMPTZ | Yes      | Creation time                                  |

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

---

# Member 3 Module — Career Assistant & Tracker

## Owner

Member 3

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

---

# Table: cover_letters

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

| Column       | Type                    | Required | Description                               |
| ------------ | ----------------------- | -------- | ----------------------------------------- |
| id           | UUID                    | Yes      | Application ID                            |
| user_id      | UUID                    | Yes      | Owner user                                |
| job_id       | UUID                    | No       | Related job                               |
| job_match_id | UUID                    | No       | Related fit score                         |
| status       | application_status ENUM | Yes      | saved/applied/interviewing/offer/rejected |
| notes        | TEXT                    | No       | User notes                                |
| applied_at   | TIMESTAMPTZ             | No       | Application date                          |
| deadline     | DATE                    | No       | Application deadline                      |
| created_at   | TIMESTAMPTZ             | Yes      | Creation time                             |
| updated_at   | TIMESTAMPTZ             | Yes      | Last update time                          |

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
| priority        | INTEGER          | Yes      | Priority level                  |
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

# Feature-to-Owner Mapping

| Feature          | Owner    | Tables Used                                 |
| ---------------- | -------- | ------------------------------------------- |
| CV Upload        | Member 1 | resumes                                     |
| PDF/DOCX Parsing | Member 1 | resumes, resume_sections                    |
| Chunking         | Member 1 | resume_chunks                               |
| Embeddings       | Member 1 | resume_chunks                               |
| RAG Retrieval    | Member 1 | resume_chunks                               |
| Skill Extraction | Member 1 | user_skills                                 |
| Job Search       | Member 2 | job_searches, jobs                          |
| Job Cards        | Member 2 | jobs                                        |
| Fit Score        | Member 2 | job_matches, user_skills, resume_chunks     |
| Ranking Logic    | Member 2 | job_matches                                 |
| AI Chat          | Member 3 | assistant_conversations, assistant_messages |
| Cover Letter     | Member 3 | cover_letters, resumes, jobs                |
| Roadmap          | Member 3 | roadmaps, roadmap_items                     |
| Calendar         | Member 3 | calendar_events                             |
| Kanban Board     | Member 3 | applications, application_history           |
| Dashboard        | Member 3 | applications, tasks, roadmaps, goals        |
| AI Reminders     | Member 3 | calendar_events, tasks, goals               |
| Evaluation Suite | Shared   | evaluation_tests                            |

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
  status application_status default 'saved',
  notes text,
  applied_at timestamptz,
  deadline date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
```

---

# Final Recommended Development Order

## Member 1 First

```text
profiles
resumes
resume_sections
resume_chunks
user_skills
```

## Member 2 Next

```text
job_searches
jobs
job_matches
```

## Member 3 Next

```text
assistant_conversations
assistant_messages
cover_letters
applications
application_history
roadmaps
roadmap_items
goals
tasks
calendar_events
skill_gap_analysis
```

## Shared Bonus

```text
evaluation_tests
```

---

# Final Design Principle

The schema has many tables, but only 3 main team modules.

Each member owns one domain.

The tables are separated only because different features need clean data storage.

The ownership remains simple:

```text
Member 1 = CV Intelligence
Member 2 = Job Intelligence
Member 3 = Career Assistant & Tracker
Shared = Profiles + Evaluation
```
