# CareerPilot Evaluation Suite

Documented test cases for hackathon judging. Run each case manually against a local `docker compose up` stack with valid Supabase, Gemini, and JSearch credentials.

| # | Feature | Input | Expected | How to verify | Pass criteria |
|---|---------|-------|----------|---------------|---------------|
| 1 | CV upload pipeline | Upload a processed PDF/DOCX on `/resume` | Status `processed`; sections and skills visible | Upload → wait for processing → open preview | Chunks exist in DB; skills listed in UI |
| 2 | Job Hunter live search | Search "backend engineer remote" with processed CV on `/jobs` | ≥1 structured match card with fit score 0–100 | Run search with JSearch key configured | Cards show title, company, fit %, matched/gaps |
| 3 | Programmatic fit score | Open match card "Why this match" | Explanation cites skills overlap + CV similarity; not generic LLM-only score | Expand card explanation | `fit_score` matches backend formula; evidence snippets shown |
| 4 | Save to tracker | Click "Save to Tracker" on a match | Application appears in `/tracker` Saved column with title/company | Save → open tracker drawer | Idempotent save; denormalized fields populated |
| 5 | Cross-module: cover letter | From match card click "Draft cover letter" | `/cover-letters?jobId=…` pre-fills role; generate succeeds | Generate letter from prefilled form | Letter saved with `job_id` linked |
| 6 | Cross-module: skill gap | From match click "Analyze skill gaps" | `/skill-gap` prefilled; analysis saved in history | Run analysis | `skill_gap_analysis` row with missing skills |
| 7 | Assistant job context | From match click "Ask assistant"; send readiness prompt | Answer references specific posting + CV evidence | `/chat?jobId=…` → benchmark prompt | `used_job_id` set on assistant message |
| 8 | Dashboard metrics | Open `/dashboard` after CV processed | Skills Added > 0; pipeline chart reflects tracker | Load dashboard | `skillsAdded` matches `user_skills` count |
| 9 | Job-match nudge | Generate AI nudges on dashboard with unsaved high-fit matches | Nudge mentions reviewing matches → `/jobs` | Click Refresh nudges | Deterministic or LLM nudge with `actionHref: /jobs` |
| 10 | Intent routing (chat) | Ask "What skills am I missing for ML Engineer?" | Skill-gap formatted response grounded in CV | `/chat` without job context | Intent `skill_gap` detected; no invented background |

## Recording results

For each run, note:

- **Actual**: what you observed
- **Pass/Fail**: against expected column
- **Environment**: date, branch, API keys present (Y/N)

## Demo script (5 minutes)

1. **CV (30s)** — Upload CV on `/resume`; show processed status.
2. **Job Hunter (90s)** — Search roles; open match details; show fit score, gaps, evidence.
3. **Actions (90s)** — Draft cover letter (prefilled), run skill gap, open roadmap link.
4. **Assistant (60s)** — Ask assistant from job context; show grounded answer.
5. **Tracker + Dashboard (30s)** — Save match; show fit data in application drawer; dashboard skills + job nudge.
