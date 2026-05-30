# CareerPilot — Frontend GUI Checklist

> UI audit of `frontend/src` — **May 30, 2026**  
> Companion: [`checklist.md`](./checklist.md) (full product requirements)  
> Includes Part 2 cross-module flows + grouped navigation / `PageShell` theme polish

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Page / modal / flow implemented and wired |
| ⚠️ | Partial UI, missing polish, or not fully connected |
| ❌ | Not built in frontend |

## Route map (App Router)

| Route | Page file | Auth gate | `AppNav` |
|-------|-----------|-----------|----------|
| `/` | `app/page.tsx` | Public | ❌ (landing has own nav) |
| `/login` | `app/login/page.tsx` | Public | ❌ |
| `/tracker` | `app/tracker/page.tsx` | ✅ `?next=` | ✅ |
| `/dashboard` | `app/dashboard/page.tsx` | ✅ | ✅ |
| `/jobs` | `app/jobs/page.tsx` | ✅ | ✅ |
| `/resume` | `app/resume/page.tsx` | ✅ | ✅ |
| `/skill-gap` | `app/skill-gap/page.tsx` | ✅ | ✅ |
| `/cover-letters` | `app/cover-letters/page.tsx` | ✅ | ✅ |
| `/cover-letters/[id]` | `app/cover-letters/[id]/page.tsx` | ✅ | ✅ |
| `/roadmap` | `app/roadmap/page.tsx` | ✅ | ✅ |
| `/roadmap/[id]` | `app/roadmap/[id]/page.tsx` | ✅ | ✅ |
| `/goals` | `app/goals/page.tsx` | ✅ | ✅ |
| `/calendar` | `app/calendar/page.tsx` | ✅ | ✅ |
| `/chat` | `app/chat/page.tsx` | ✅ | ✅ |

---

## General — Shell, Auth & Marketing

### Pages

| Page | Path | Status | Notes |
|------|------|--------|-------|
| Landing / marketing hub | `/` | ✅ | Hero, 11 live module cards, minimal “coming next” (AI nudges only) |
| Sign in / sign up | `/login` | ✅ | Email + password; `?next=` redirect; branded header |
| — | — | — | No `/settings` or `/profile` pages |

### Layout & global UI

| Item | Status | Notes |
|------|--------|-------|
| Root layout (`app/layout.tsx`) | ✅ | Geist fonts, `Providers`, `--cp-page-bg` token |
| React Query provider | ✅ | 20s default `staleTime` |
| Sonner toasts | ✅ | Global success/error feedback |
| Shared design tokens | ✅ | `lib/ui-theme.ts` — `pageShell`, `surfaceCard`, `btnPrimary`, alerts |
| Page shell component | ✅ | `PageShell` + `PageHeader` with icon, description, related-link pills |
| Global `AppNav` | ✅ | All authenticated routes; grouped dropdowns (Discover / Plan / Track) |
| Nav context sub-bar | ✅ | `NavContextBar` — sibling links within active section (desktop) |
| Mobile navigation | ✅ | `MobileNavDrawer` + hamburger trigger; grouped sections + sign out |
| Nav color hierarchy | ✅ | Emerald (Discover), sky (Plan), violet (Track); hover + active states |
| Per-page duplicate headers | ✅ | Removed redundant headers / sign-out from tracker, goals, calendar, resume |
| Sign out | ✅ | Centralized in `AppNav` (desktop) + mobile drawer |
| Responsive layout | ✅ | Mobile drawer; chat sidebar stacks; nav no longer horizontally cramped |
| Dark mode | ❌ | Light theme only |
| Error boundary page | ✅ | Branded `app/error.tsx` + `app/not-found.tsx` |

### Modals / overlays (general)

| UI | Status | Notes |
|----|--------|-------|
| Browser `confirm()` dialogs | ✅ | Replaced with shared `ConfirmDialog` in tracker/chat/goals/calendar/tasks |
| Dedicated confirm modal component | ✅ | `components/ui/confirm-dialog.tsx` |

### User flows (general)

| Flow | Status | Steps |
|------|--------|-------|
| First visit → sign up | ✅ | `/` → Sign in → Sign up tab → redirect `?next=` (default `/tracker`) |
| Return visit → sign in | ✅ | `/login` auto-redirect if session exists |
| Protected route without session | ✅ | Server `getUser()` → `/login?next=<path>` |
| Discover modules from landing | ✅ | 11 live cards incl. Job Hunter, Skill Gap, Roadmap, Dashboard |
| Cross-module navigation via `AppNav` | ✅ | Group menus → all 10 workspace routes |
| Cross-module via related links | ✅ | `PageHeader` pills per route (`PAGE_RELATED_LINKS`) |
| Cross-module from Job Hunter | ✅ | Match card / drawer actions → cover letter, gap, roadmap, chat, tracker |

### Landing page sections (`app/page.tsx`)

| Section | Status | Notes |
|---------|--------|-------|
| Hero + CTAs | ✅ | Links to `/login`, `/login?next=/tracker` |
| Live module cards (`corePages`) | ✅ | Job Hunter, Chat, Tracker, Skill Gap, Roadmap, Goals, Calendar, Tasks, Resume, Cover Letters, Dashboard |
| “Coming next” cards | ⚠️ | Only **AI Nudges** listed (partial on `/dashboard` today) |
| Proof points strip | ✅ | Static feature bullets |

---

## Pillar 1 — Job Hunter Agent

### Pages

| Page | Path | Status | Notes |
|------|------|--------|-------|
| Job Hunter | `/jobs` | ✅ | `JobsPageClient` + `PageShell` + `AppNav` |

### Panels & components

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Page header | `jobs-page-client.tsx` | ✅ | `PageHeader` + 3-step onboarding strip + related links |
| No-CV empty state | `jobs-page-client.tsx` | ✅ | Link to `/resume` |
| Job search form | `search-form.tsx` | ✅ | Query, location, resume picker, JSearch source, `SpinnerButton` submit |
| JSearch live search | `search-form.tsx` → `POST /api/v1/jobs/search` | ✅ | Wired to backend `JSearchAdapter`; **verified E2E** |
| JSearch error feedback | `search-form.tsx` + toasts | ✅ | Subscription/key/quota errors via `JSearchError` → Sonner |
| Source selector | `search-form.tsx` | ⚠️ | Type supports `manual`; UI only lists **JSearch** (manual via drawer) |
| Match list | `jobs-page-client.tsx` | ✅ | `ListCardSkeleton`, empty state, previous matches accordion |
| Match card | `match-card.tsx` | ✅ | Fit tier, salary/deadline, skills, evidence, save state, **cross-module actions** |
| Cross-module actions | `match-job-actions.tsx` | ✅ | Cover letter, skill gap, roadmap, assistant, tracker links with `jobId` |
| Fit score badge | `match-card.tsx` | ✅ | Color by score tier |
| Resume selector | `search-form.tsx` | ✅ | Dropdown of user resumes |

### Modals / drawers

| UI | Status | Notes |
|----|--------|-------|
| Manual job paste drawer | ✅ | `manual-job-drawer.tsx` |
| Job detail drawer | ✅ | `match-detail-drawer.tsx` — JD, fit breakdown, evidence, save, **MatchJobActions** |
| Fit score breakdown | ✅ | Expandable panel + drawer with skills/similarity bars |

### User flows

| Flow | Status | Steps |
|------|--------|-------|
| Search jobs with NL query | ✅ | Pick resume → query (+ location) → Search → match cards |
| View fit & reasoning | ✅ | Expandable why + detail drawer with CV evidence |
| Save job to tracker | ✅ | Idempotent save; tracker shows title/company + fit join |
| Open original posting | ✅ | “View posting” when `source_url` present |
| Search without CV | ✅ | Amber banner + link to upload |
| Paste JD for fit (manual) | ✅ | Manual job drawer |
| Filter/sort matches | ✅ | `match-filters.tsx` |
| Jump to cover letter / gap / roadmap / chat | ✅ | Actions on card + drawer with URL prefill |
| View past searches | ✅ | `search-history-panel.tsx` on `/jobs`; `GET /api/v1/jobs/searches` |

---

## Pillar 2 — Profile & Resume Intelligence (RAG Core)

### Pages

| Page | Path | Status | Notes |
|------|------|--------|-------|
| CV Intelligence | `/resume` | ✅ | `ResumePageClient` + `PageShell` + `AppNav` |

### Panels & components

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Page header + status badge | `resume-page-client.tsx` | ✅ | `PageHeader`; RAG status badge in actions slot |
| Multi-resume selector | `resume-page-client.tsx` | ✅ | Shown when >1 resume |
| Upload card (drag-and-drop) | `resume-upload-card.tsx` | ✅ | PDF/DOCX, progress strip, preview drawer |
| Resume summary | `resume-summary.tsx` | ✅ | Sections, skills, delete, edit-in-builder/manual |
| Ask about CV panel | `resume-answer-box.tsx` | ✅ | Sample chips, answer + evidence |
| Semantic query box | `resume-query-box.tsx` | ✅ | Collapsible advanced panel |
| CV builder + manual editor | ✅ | Upload \| Build \| Manual tabs |
| Shared UI tokens | `resume-ui.ts` + `ui-theme.ts` | ✅ | Consistent cards, buttons, inputs |

### User flows

| Flow | Status | Steps |
|------|--------|-------|
| Upload / build / manual CV | ✅ | Full pipeline to indexed RAG |
| Ask grounded question | ✅ | Answer + evidence cards |
| Raw semantic chunk search | ✅ | Advanced panel on `/resume` |

---

## Pillar 3 — Personal AI Assistant

### Pages

| Page | Path | Status | Notes |
|------|------|--------|-------|
| AI Career Assistant | `/chat` | ✅ | `ChatWorkspace` + `AppNav`; sky accent sidebar |
| Skill Gap Analysis | `/skill-gap` | ✅ | Analyze form, saved list, detail panel, Job Hunter prefill |
| Cover Letter Studio | `/cover-letters` | ✅ | Generate + list; `?jobId=` prefill |
| Cover Letter detail | `/cover-letters/[id]` | ✅ | Edit, regenerate, delete |
| Roadmap hub | `/roadmap` | ✅ | Generate + list; URL prefill (`targetRole`, `jobDescription`, `company`) |
| Roadmap detail | `/roadmap/[id]` | ✅ | Timeline, task/calendar actions |

### Panels & components

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Conversation sidebar | `ConversationSidebar.tsx` | ✅ | Grouped list, new chat, rename, delete, related-link pills |
| Chat thread | `ChatThread.tsx` | ✅ | Job context chip, CV-grounded badge, streaming |
| Message bubbles | `ChatMessage.tsx` | ✅ | User sky bubbles; assistant Markdown + evidence |
| Streaming composer | `MessageComposer.tsx` | ✅ | Sky focus ring |
| Suggested prompts | `ChatThread.tsx` | ✅ | Generic defaults; **job-specific benchmark prompts** when `?jobId=` set |
| No-CV banner | `ChatMessage.tsx` | ✅ | Links to `/resume` |
| Save Cover Letter / Roadmap | `ChatMessage.tsx` | ✅ | Metadata-driven action buttons |
| Skill gap analyze form | `skill-gap-analyze-form.tsx` | ✅ | Prefill from Job Hunter; preview missing skills |
| Skill gap history | `skill-gap-list.tsx` | ✅ | Select prior analyses |
| Intent badge in UI | ✅ | `intent-badge.tsx` on assistant messages + thread header |

### User flows

| Flow | Status | Steps |
|------|--------|-------|
| Create / select conversation | ✅ | Sidebar |
| Send message (streaming) | ✅ | SSE via `/api/assistant/chat` |
| Chat with job context | ✅ | `/chat?jobId=` → chip + grounded prompts + `used_job_id` |
| Skill gap dedicated page | ✅ | `/skill-gap` analyze → save → revisit in list/detail |
| Cover letter with job prefill | ✅ | From `/jobs` action or `?jobId=` on `/cover-letters` |
| Roadmap with role/JD prefill | ✅ | From jobs action or URL params |
| Readiness / gap / roadmap / letter via chat | ✅ | Guided workflows (Roadmap, Cover Letter, Readiness wizards) + free-text intents |

---

## Pillar 4 — Productivity & Progress Tracker

### Pages

| Page | Path | Status | Notes |
|------|------|--------|-------|
| Application Tracker | `/tracker` | ✅ | `PageShell` + Kanban |
| Goals | `/goals` | ✅ | `PageShell` + tasks column |
| Calendar | `/calendar` | ✅ | `PageShell` + `AppNav` (no duplicate header links) |
| Progress dashboard | `/dashboard` | ✅ | Metrics, pipeline, nudges, activity |

### Tracker highlights

| Component | Status | Notes |
|-----------|--------|-------|
| Kanban + DnD | ✅ | 5 columns |
| Application detail drawer | ✅ | History timeline; **fit score / matched & missing skills** when `job_match` linked |
| Links from drawer | ✅ | Job Hunter, cover letter, chat when job linked |
| Add application drawer | ✅ | Manual entry |

### Dashboard

| Component | Status | Notes |
|-----------|--------|-------|
| Metric cards | ✅ | Incl. **skillsAdded** (emerald icons) |
| Pipeline chart | ✅ | Emerald bar fill |
| AI nudges | ✅ | High-fit unsaved matches in reminder summary |
| Skills-added widget | ✅ | Live count from API |
| Global on-login nudges | ❌ | Dashboard section only |

### Calendar & goals

| Item | Status | Notes |
|------|--------|-------|
| Calendar views + events | ✅ | Month/week; synthetic application deadlines |
| Goals + standalone tasks | ✅ | `/goals` with `TaskList` |
| Roadmap → task / calendar | ✅ | From roadmap detail |

---

## Navigation & design system (new / updated)

| Item | Status | Notes |
|------|--------|-------|
| Grouped nav menus | ✅ | `NavGroupMenu.tsx` — Discover / Plan / Track dropdown panels with descriptions |
| Section context bar | ✅ | `NavContextBar.tsx` — quick pills within active group (lg+) |
| Mobile nav drawer | ✅ | `MobileNavDrawer.tsx` — color-coded sections |
| Nav config single source | ✅ | `lib/navigation-config.ts` — groups, related links |
| Accent style map | ✅ | `lib/nav-styles.ts` — emerald / sky / violet tokens |
| Page related links | ✅ | `PageHeader` pills on jobs, resume, tracker, dashboard, etc. |
| Theme CSS variables | ✅ | `globals.css` — `--cp-primary`, `--cp-accent`, nav heights |
| Chat sky / brand emerald split | ✅ | Assistant UI sky; primary actions emerald |

### New frontend files (from Part 2 + polish)

| Path | Purpose |
|------|---------|
| `lib/navigation-config.ts` | Nav groups, related links |
| `lib/nav-styles.ts` | Group accent classes, active-route helpers |
| `lib/ui-theme.ts` | Shared Tailwind class bundles |
| `components/layout/page-shell.tsx` | `PageShell`, `PageHeader` |
| `components/nav/NavGroupMenu.tsx` | Desktop dropdown menus |
| `components/nav/NavContextBar.tsx` | Section sub-navigation |
| `components/nav/MobileNavDrawer.tsx` | Mobile menu + trigger |
| `features/jobs/job-actions.ts` | URL builders for cross-module links |
| `features/jobs/search-history-panel.tsx` | Job search history browser on `/jobs` |
| `features/jobs/job-search-history-card.tsx` | Search history card UI |
| `components/ui/confirm-dialog.tsx` | Shared destructive confirm modal |
| `components/chat/intent-badge.tsx` | Assistant intent pill badges |
| `components/chat/guided-workflows.tsx` | Roadmap / cover letter / readiness wizards |
| `components/chat/workflow-wizard-modal.tsx` | Guided workflow modal shell |
| `components/chat/workflow-prompt-builders.ts` | Wizard prompt templates |
| `app/error.tsx` | Branded error boundary page |
| `app/not-found.tsx` | Branded 404 page |
| `features/jobs/match-job-actions.tsx` | Action buttons on match UI |
| `features/skill-gap/*` | Skill gap page module |
| `lib/hooks/useSkillGap.ts` | Skill gap queries + analyze mutation |

---

## Shared UX patterns

| Pattern | Status | Notes |
|---------|--------|-------|
| Loading skeletons | ✅ | Shared + per-feature |
| Spinner buttons | ✅ | Emerald primary variant |
| Submission progress | ✅ | Sky tone on AI generation pages |
| Empty states with CTA | ✅ | Most lists |
| Sonner toasts | ✅ | Search, save, upload, etc. |
| Markdown in chat | ✅ | `react-markdown` |
| Shared confirm modal | ✅ | `ConfirmDialog` used across tracker/chat/goals/calendar/tasks |

---

## End-to-end demo flows (judging video)

| Demo step | UI path | Status |
|-----------|---------|--------|
| 1. CV upload | `/resume` → upload card | ✅ |
| 2. Job search | `/jobs` → search → match cards | ✅ |
| 3. Fit score visible | Match card + drawer | ✅ |
| 4. Cross-module from match | Cover letter / skill gap / roadmap / chat actions | ✅ |
| 5. AI assistant query | `/chat` → message (optional `?jobId=`) | ✅ |
| 6. Cover letter draft | `/cover-letters` or chat save | ✅ |
| 7. Skill gap | `/skill-gap` with Job Hunter prefill | ✅ |
| 8. Roadmap | `/roadmap` → task/calendar | ✅ |
| 9. Tracker update | `/tracker` → DnD or drawer with fit data | ✅ |
| 10. Dashboard | `/dashboard` → metrics + nudges | ✅ |

---

## Frontend priority backlog

1. ❌ **5-minute demo video** — organizer deliverable (not a UI task).
2. ✅ **Shared confirm modal** — `ConfirmDialog` replaces browser confirms in tracker/chat/goals/calendar/tasks.
3. ⚠️ **Global nudges** — on-login or app-wide banner beyond `/dashboard`.
4. ✅ **Search history UI** — browse past `job_searches` on `/jobs` with view/re-run actions.
5. ✅ **Chat intent badge** — intent pill on assistant messages and thread header.
6. ✅ **Conversation rename** — inline edit in sidebar via Supabase update.
7. ❌ **Dark mode** — optional polish.
8. ✅ **Branded `error.tsx` / `not-found.tsx`** — CareerPilot-themed error and 404 pages.
9. ✅ **Detail pages theme** — `/cover-letters/[id]`, `/roadmap/[id]` migrated to sky accent + `DetailPageShell`.
10. ⚠️ **Landing hero copy** — align with fully live assistant + nudges story.

---

*Re-audit after UI changes by walking each route in the running app (`docker compose up`) and updating status emojis.*

---

## Implementation Notes (2026-05-30)

**Implemented:** Job search history panel on `/jobs` (view stored results, re-run prefill); `GET /api/v1/jobs/searches`; shared `ConfirmDialog` replacing browser confirms; chat conversation rename; intent badges; guided assistant wizards; branded `error.tsx` / `not-found.tsx`.

**Key files:** `confirm-dialog.tsx`, `search-history-panel.tsx`, `job-search-history-card.tsx`, `useAssistantConversations.ts` (update hook), `ConversationSidebar.tsx`, `intent-badge.tsx`, `guided-workflows.tsx`, `workflow-wizard-modal.tsx`, `workflow-prompt-builders.ts`, `app/error.tsx`, `app/not-found.tsx`, `backend/.../jobs.py`, `job_service.py`.

**Limitations:** Re-run search prefills the form but does not auto-execute (avoids surprise JSearch API calls). Search history has no per-search `resume_id` stored — view results uses `search_id` only; re-run uses the currently selected CV.

---

## Authenticated app UI polish (2026-05-30)

**Completed:** Full visual upgrade of all workspace pages to match landing-page quality — premium cards, emerald/sky/violet accent groups, gradient page backgrounds, shared `EmptyState`/`Badge`/`SurfaceCard`, polished login, and branded error/404 pages.

**Core design system:** `lib/ui-theme.ts`, `lib/nav-styles.ts`, `app/globals.css`, `components/layout/page-shell.tsx`, `components/layout/detail-page-shell.tsx`, `components/ui/empty-state.tsx`, `components/ui/badge.tsx`, `components/ui/surface-card.tsx`, `components/ui/skeleton.tsx`.

**Page groups updated:**
- **Track (violet):** dashboard, tracker, goals, calendar
- **Discover (emerald):** resume, jobs
- **Plan (sky):** skill-gap, cover-letters, roadmap (list + detail)
- **Assistant:** chat sidebar, bubbles, evidence cards
- **Global:** login, `error.tsx`, `not-found.tsx`

**Remaining limitations:** No dark mode; `react-big-calendar` base CSS still imported; chat intentionally omits standard `PageHeader`; dense forms/tables avoid hover-lift animations.
