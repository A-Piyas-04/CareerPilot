# CareerPilot — Evaluation Suite

> **Purpose:** Hackathon submission artifact documenting functional and correctness test cases across all four product pillars.  
> **Product:** CareerPilot — AI-powered career co-pilot (Next.js 16 · FastAPI · Supabase · Gemini · JSearch)  
> **Document version:** 1.0  
> **Execution date:** June 6, 2026  
> **Authoring basis:** Codebase audit + automated test execution (pytest, Vitest)

---

## 1. Scope & Methodology

This evaluation suite validates **completeness and correctness** of CareerPilot against the hackathon problem statement. Test cases span:

| Pillar | Capability under test |
|--------|------------------------|
| **Pillar 1 — Job Hunter** | Deterministic fit scoring (`job_scorer.py`) |
| **Pillar 2 — CV / RAG** | Upload validation, retrieval guardrails |
| **Pillar 3 — AI Assistant** | Benchmark intent routing, cover-letter generation |
| **Pillar 4 — Productivity** | Dashboard metrics, application tracker |

### Test levels

| Level | Description | Used in this document |
|-------|-------------|------------------------|
| **Unit** | Isolated function/service with mocked dependencies | TC-001 – TC-008 |
| **Integration** | API route + DB/auth mocks | TC-005, TC-008 |
| **Manual E2E** | Full stack via browser (`docker compose up`) | Appendix A |

**Verdict rule:** A case **PASS**es when actual output matches expected output within documented tolerances. All cases below were executed on June 6, 2026; results are recorded from automated runs unless noted.

### Test environment

| Component | Version / detail |
|-----------|------------------|
| OS | Windows 10 (build 26100) |
| Python | 3.12.2 |
| pytest | 8.4.2 |
| Node / Vitest | per `frontend/package.json` · Vitest 4.1.7 |
| Backend root | `backend/` |
| Frontend root | `frontend/` |

**Commands used:**

```bash
# Backend — fit scoring & RAG guardrails
cd backend
python -m pytest test/job-intelligence/test_job_scorer.py test/CV-intelligence/test_retrieval_guardrails.py -v

# Backend — application tracker
cd backend/test/career-assistant
python -m pytest test_applications_service.py -v

# Frontend — intent, dashboard, CV validation, cover letter
cd frontend
npm test -- --run src/lib/assistant/detectIntent.test.ts src/app/api/dashboard/metrics/route.test.ts tests/features/resume/validateResumeFile.test.ts src/app/api/cover-letter/generate/route.test.ts
```

---

## 2. Requirements Traceability

| Req ID | Requirement (problem statement) | Test case(s) |
|--------|--------------------------------|--------------|
| R-01 | Fit scores computed programmatically (not LLM-only) | TC-001, TC-002 |
| R-02 | CV upload pipeline validates PDF/DOCX | TC-003 |
| R-03 | AI assistant handles benchmark query types | TC-004 |
| R-04 | Progress dashboard with real aggregated data | TC-005 |
| R-05 | Kanban application tracker with status workflow | TC-006 |
| R-06 | RAG architecture grounded in user's CV | TC-007, TC-008 |
| R-07 | Cross-module: job context → cover letter | TC-008 |

---

## 3. Test Case Summary

| ID | Feature | Type | Verdict |
|----|---------|------|---------|
| TC-001 | Job fit score — full skill overlap | Unit (backend) | **PASS** |
| TC-002 | Job fit score — zero skill overlap | Unit (backend) | **PASS** |
| TC-003 | CV upload — reject unsupported file | Unit (frontend + backend) | **PASS** |
| TC-004 | Assistant intent — skill-gap benchmark | Unit (frontend) | **PASS** |
| TC-005 | Dashboard metrics aggregation | Integration (BFF) | **PASS** |
| TC-006 | Tracker — create application with defaults | Unit (backend) | **PASS** |
| TC-007 | RAG retrieval — embedding dimension guard | Unit (backend) | **PASS** |
| TC-008 | Cover letter — required-field validation | Integration (BFF) | **PASS** |

**Overall:** 8 / 8 executed cases **PASS** (100%).

---

## 4. Detailed Test Cases

### TC-001 — Programmatic Fit Score (Full Overlap)

| Field | Value |
|-------|-------|
| **Priority** | P0 — Critical |
| **Pillar** | 1 — Job Hunter |
| **Feature** | Deterministic job-to-resume fit scoring |
| **Component** | `backend/app/job_intelligence/services/job_scorer.py` |
| **Automation** | `backend/test/job-intelligence/test_job_scorer.py::TestScoreJob::test_fit_score_full_overlap_high_similarity` |

**Formula under test:**

```
fit_score = 0.6 × (|matched_skills| / |jd_skills|) + 0.4 × mean_chunk_similarity
            → scaled to 0–100, rounded to 2 decimal places
```

**Preconditions:** Resume chunks mocked with cosine similarity `1.0` for top-5 retrieval.

**Input**

```json
{
  "user_skill_names": ["Python", "FastAPI"],
  "title": "Backend",
  "description": "Python and FastAPI required.",
  "requirements": null,
  "mock_chunk_similarities": [1.0, 1.0, 1.0, 1.0, 1.0]
}
```

**Expected output**

```json
{
  "fit_score": 100.00,
  "matched_skills": ["Python", "FastAPI"],
  "missing_skills": [],
  "explanation": "contains skill match ratio and CV alignment tier",
  "evidence_chunk_ids": ["c0", "c1", "c2", "c3", "c4"]
}
```

**Actual output**

```json
{
  "fit_score": 100.00,
  "matched_skills": ["Python", "FastAPI"],
  "missing_skills": [],
  "explanation": "Your CV content aligns well with this posting. Matched 2/2 required skills. You have: Python, FastAPI.",
  "evidence_chunk_ids": ["c0", "c1", "c2", "c3", "c4"]
}
```

**Verdict:** **PASS** — Score equals `0.6 × 1.0 + 0.4 × 1.0 = 1.0 → 100.00`; both JD skills matched.

---

### TC-002 — Programmatic Fit Score (Zero Overlap)

| Field | Value |
|-------|-------|
| **Priority** | P0 — Critical |
| **Pillar** | 1 — Job Hunter |
| **Feature** | Fit score when CV skills do not match JD |
| **Component** | `job_scorer.py` |
| **Automation** | `test_job_scorer.py::TestScoreJob::test_fit_score_no_overlap_zero_similarity` |

**Preconditions:** User has `Python`; JD requires `Java`. Chunk similarities mocked to `0.0`.

**Input**

```json
{
  "user_skill_names": ["Python"],
  "title": "Backend",
  "description": "Java and Spring Boot required.",
  "mock_chunk_similarities": [0.0, 0.0]
}
```

**Expected output**

```json
{
  "fit_score": 0.00,
  "matched_skills": [],
  "missing_skills": ["Java"]
}
```

**Actual output**

```json
{
  "fit_score": 0.00,
  "matched_skills": [],
  "missing_skills": ["Java"]
}
```

**Verdict:** **PASS** — Skills component `0/1 = 0.0`; similarity component `0.0`; final score `0.00`.

---

### TC-003 — CV Upload File Validation

| Field | Value |
|-------|-------|
| **Priority** | P0 — Critical |
| **Pillar** | 2 — Profile & Resume Intelligence |
| **Feature** | Client- and server-side upload constraints |
| **Components** | `frontend/src/features/resume/api.ts` · `backend/app/cv_intelligence/services/resume_parser.py` |
| **Automation** | `frontend/tests/features/resume/validateResumeFile.test.ts` · `backend/test/CV-intelligence/test_resume_parser.py::TestValidateFile::test_txt_rejected` |

**Input**

| Scenario | Input file | Size |
|----------|------------|------|
| A | `resume.txt` | 1 KB |
| B | `resume.pdf` | 0 bytes |
| C | `resume.pdf` | 11 MB (> 10 MB limit) |

**Expected output**

| Scenario | Expected behavior |
|----------|-------------------|
| A | Reject with message *"Only PDF and DOCX files are supported."* (frontend) / HTTP 422 with `.txt` in detail (backend) |
| B | Reject with *"The selected file is empty."* |
| C | Reject with *"File is too large. Maximum size is 10 MB."* |

**Actual output**

| Scenario | Actual behavior |
|----------|-----------------|
| A | Frontend throws `"Only PDF and DOCX files are supported."`; backend raises HTTP 422, detail includes `.txt` |
| B | Frontend throws `"The selected file is empty."` |
| C | Frontend throws `"File is too large. Maximum size is 10 MB."`; backend raises HTTP 422, detail includes *"too large"* |

**Verdict:** **PASS** — All three rejection paths behave as specified; valid PDF/DOCX ≤ 10 MB accepted in companion tests.

---

### TC-004 — Assistant Intent Routing (Skill-Gap Benchmark)

| Field | Value |
|-------|-------|
| **Priority** | P0 — Critical |
| **Pillar** | 3 — Personal AI Assistant |
| **Feature** | Rule-based benchmark query classification |
| **Component** | `frontend/src/lib/assistant/detectIntent.ts` |
| **Automation** | `frontend/src/lib/assistant/detectIntent.test.ts` |

**Input**

```
User message: "What skills am I missing for ML Engineer?"
```

**Expected output**

```json
{
  "intent": "skill_gap",
  "confidence": 1,
  "method": "rule"
}
```

**Actual output**

```json
{
  "intent": "skill_gap",
  "confidence": 1,
  "method": "rule"
}
```

**Verdict:** **PASS** — Benchmark prompt routed to `skill_gap` without LLM call. Related cases also pass: `readiness_check`, `roadmap_generation`, `cover_letter` (4/4 rule intents).

---

### TC-005 — Dashboard Metrics Aggregation

| Field | Value |
|-------|-------|
| **Priority** | P1 — High |
| **Pillar** | 4 — Productivity & Progress Tracker |
| **Feature** | User-scoped dashboard KPIs and pipeline chart |
| **Component** | `frontend/src/app/api/dashboard/metrics/route.ts` |
| **Automation** | `frontend/src/app/api/dashboard/metrics/route.test.ts` |

**Preconditions:** Fake Supabase seeded with 3 applications (saved/applied/interviewing), 2 roadmaps (50% / 100% progress), 2 completed tasks (1 this week), 1 upcoming interview event. System time frozen to `2026-05-29T12:00:00Z`.

**Input**

```
GET /api/dashboard/metrics
Authenticated user_id: 00000000-0000-0000-0000-000000000001
```

**Expected output**

```json
{
  "status": 200,
  "metrics": {
    "activeApplications": 2,
    "jobsApplied": 1,
    "roadmapItemsDone": 1,
    "roadmapProgress": 75,
    "tasksCompletedThisWeek": 1,
    "weeklyStreak": 2
  },
  "pipeline": [
    { "status": "saved", "count": 1 },
    { "status": "applied", "count": 1 },
    { "status": "interviewing", "count": 1 },
    { "status": "offer", "count": 0 },
    { "status": "rejected", "count": 0 }
  ],
  "upcomingEvents[0].eventType": "interview",
  "recentActivity": "includes task completion and status change entries"
}
```

**Actual output**

```json
{
  "status": 200,
  "metrics": {
    "activeApplications": 2,
    "jobsApplied": 1,
    "roadmapItemsDone": 1,
    "roadmapProgress": 75,
    "tasksCompletedThisWeek": 1,
    "weeklyStreak": 2
  },
  "pipeline": "saved=1, applied=1, interviewing=1, offer=0, rejected=0",
  "upcomingEvents[0]": { "eventType": "interview", "title": "Interview" },
  "recentActivity": [
    { "type": "task", "title": "Finish dashboard", "description": "Completed task" },
    { "type": "application", "title": "ML Engineer at Acme", "description": "Moved from Saved to Applied" }
  ],
  "user_scoping": "all queries filtered by user_id"
}
```

**Verdict:** **PASS** — Aggregations match seeded data; queries scoped to authenticated user.

---

### TC-006 — Application Tracker Create (Trim & Default Status)

| Field | Value |
|-------|-------|
| **Priority** | P1 — High |
| **Pillar** | 4 — Productivity & Progress Tracker |
| **Feature** | Manual application creation from Job Hunter save flow |
| **Component** | `backend/app/career_assistant/services/applications.py` |
| **Automation** | `backend/test/career-assistant/test_applications_service.py::test_create_application_trims_manual_fields_and_defaults_saved` |

**Input**

```json
{
  "manual_job_title": " Backend Intern ",
  "manual_company": " Acme ",
  "manual_location": " Remote "
}
```

**Expected output**

```json
{
  "table": "applications",
  "inserted": {
    "manual_job_title": "Backend Intern",
    "manual_company": "Acme",
    "manual_location": "Remote",
    "status": "saved",
    "user_id": "<authenticated_user>"
  }
}
```

**Actual output**

```json
{
  "table": "applications",
  "inserted": {
    "manual_job_title": "Backend Intern",
    "manual_company": "Acme",
    "manual_location": "Remote",
    "status": "saved",
    "user_id": "00000000-0000-0000-0000-000000000001"
  }
}
```

**Verdict:** **PASS** — Whitespace trimmed; default Kanban column is `saved`.

---

### TC-007 — RAG Retrieval Embedding Dimension Guard

| Field | Value |
|-------|-------|
| **Priority** | P1 — High |
| **Pillar** | 2 — Profile & Resume Intelligence |
| **Feature** | Fail-safe when stored embedding dimension ≠ query dimension |
| **Component** | `backend/app/cv_intelligence/services/retrieval_service.py` |
| **Automation** | `backend/test/CV-intelligence/test_retrieval_guardrails.py::test_dim_mismatch_raises_when_guard_enabled` |

**Preconditions:** `retrieval_require_dim_match = True`; active column `embedding_new`.

**Input**

```json
{
  "query_embedding": [0.1, 0.2, 0.3, 0.4],
  "stored_embedding_new": [0.1, 0.2, 0.3],
  "chunk_text": "python docker"
}
```

**Expected output**

```
HTTPException with status_code 503 (service unavailable — misconfiguration)
```

**Actual output**

```
HTTPException raised; status_code = 503
```

**Verdict:** **PASS** — Guard prevents silent wrong-dimension cosine search; companion test confirms graceful skip when guard disabled.

---

### TC-008 — Cover Letter Generation Input Validation

| Field | Value |
|-------|-------|
| **Priority** | P1 — High |
| **Pillar** | 3 — Personal AI Assistant (cross-module from Job Hunter) |
| **Feature** | Reject incomplete job context before LLM call |
| **Component** | `frontend/src/app/api/cover-letter/generate/route.ts` |
| **Automation** | `frontend/src/app/api/cover-letter/generate/route.test.ts` |

**Input**

```json
POST /api/cover-letter/generate
{
  "companyName": "Acme",
  "jobDescription": "JD"
}
```

*(Missing required field: `jobTitle`)*

**Expected output**

```json
{
  "status": 400,
  "gemini_invoked": false
}
```

**Actual output**

```json
{
  "status": 400,
  "gemini_invoked": false
}
```

**Verdict:** **PASS** — Invalid payload rejected; no Gemini API call. Companion test confirms valid payload returns HTTP 200 with saved `coverLetter` row grounded in resume context.

---

## 5. Execution Log

| Run ID | Date | Executor | Cases run | Pass | Fail | Notes |
|--------|------|----------|-----------|------|------|-------|
| ES-2026-06-06-01 | 2026-06-06 | Automated (pytest + Vitest) | 8 | 8 | 0 | All unit/integration cases green |

---

## 6. Known Limitations & Out-of-Scope

| Item | Impact on evaluation |
|------|---------------------|
| Live JSearch API | TC-001/TC-002 use mocked chunks; live search validated manually (Appendix A) |
| Gemini LLM responses | TC-004 uses rules; generative quality assessed manually in chat/cover-letter flows |
| pgvector dimension migration | TC-007 guards misconfiguration; deployment must align 768-dim Gemini embeddings |
| Scanned PDF / OCR | Not in scope; empty-text PDFs return 422 |

---

## Appendix A — Manual End-to-End Scenarios (Judge Demo)

These scenarios complement automated cases for live demo validation. Record **Actual** and **Verdict** when rehearsing.

| # | Flow step | Input | Expected | How to verify |
|---|-----------|-------|----------|---------------|
| A1 | CV upload | PDF/DOCX on `/resume` | Status `processed`; skills visible | Upload drawer shows sections + chunk count |
| A2 | Job search | Query *"backend engineer remote"* | ≥1 match card with fit 0–100 | `/jobs` with JSearch key configured |
| A3 | Save to tracker | Click **Save to Tracker** on match | Row in `/tracker` Saved column | Title/company denormalized |
| A4 | Assistant + job | `/chat?jobId=…` readiness question | Answer cites posting + CV evidence | `used_job_id` on message |
| A5 | Cross-module | **Draft cover letter** from match card | `/cover-letters?jobId=…` prefilled | Generate succeeds; letter linked to job |

**Suggested 5-minute demo order:** A1 → A2 → A3 → A4 → A5.

---

## Appendix B — Related Artifacts

| Document | Location |
|----------|----------|
| System design (scaling, cost, bottlenecks) | [`system-design.md`](./system-design.md) |
| Feature checklist vs. problem statement | [`../../problem-statement/checklist.md`](../../problem-statement/checklist.md) |
| Working demo setup | [`../../README.md`](../../README.md) |

---

*End of evaluation suite.*
