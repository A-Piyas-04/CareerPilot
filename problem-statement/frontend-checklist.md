# CareerPilot — Frontend GUI Checklist

> UI audit of `frontend/src` — **May 29, 2026**  
> Companion: [`checklist.md`](./checklist.md) (full product requirements)

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Page / modal / flow implemented and wired |
| ⚠️ | Partial UI, missing polish, or not fully connected |
| ❌ | Not built in frontend |

## Route map (App Router)

| Route | Page file | Auth gate | `AppNav` |
|-------|-----------|-----------|----------|
| `/` | `app/page.tsx` | Public | ❌ |
| `/login` | `app/login/page.tsx` | Public | ❌ |
| `/tracker` | `app/tracker/page.tsx` | ✅ `?next=` | ✅ |
| `/jobs` | `app/jobs/page.tsx` | ✅ | ✅ |
| `/resume` | `app/resume/page.tsx` | ✅ | ✅ |
| `/goals` | `app/goals/page.tsx` | ✅ | ✅ |
| `/calendar` | `app/calendar/page.tsx` | ✅ | ❌ |
| `/chat` | `app/chat/page.tsx` | ✅ | ❌ |

---

## General — Shell, Auth & Marketing

### Pages

| Page | Path | Status | Notes |
|------|------|--------|-------|
| Landing / marketing hub | `/` | ✅ | Hero, workspace cards, “Coming next” section |
| Sign in / sign up | `/login` | ✅ | Email + password; `?next=` redirect after auth |
| — | — | — | No `/dashboard`, `/settings`, or `/profile` pages |

### Layout & global UI

| Item | Status | Notes |
|------|--------|-------|
| Root layout (`app/layout.tsx`) | ✅ | Geist fonts, `Providers` wrapper |
| React Query provider | ✅ | 20s default `staleTime` |
| Sonner toasts | ✅ | Global success/error feedback |
| Global `AppNav` | ⚠️ | Only on `/tracker`, `/jobs`, `/resume`, `/goals` — **not** on `/chat`, `/calendar`, landing |
| Per-page headers | ✅ | Custom headers on chat, calendar, resume, jobs, tracker, goals |
| Sign out | ⚠️ | On resume, tracker, goals, calendar headers — **not** on jobs page header |
| Responsive layout | ⚠️ | Mobile-friendly grids; chat sidebar stacks on `lg` |
| Dark mode | ❌ | Light theme only |
| Error boundary page | ❌ | No dedicated `error.tsx` / `not-found.tsx` branded pages |

### Modals / overlays (general)

| UI | Status | Notes |
|----|--------|-------|
| Browser `confirm()` dialogs | ⚠️ | Used for delete conversation, application, task, goal, calendar event |
| Dedicated confirm modal component | ❌ | No shared `ConfirmDialog` |

### User flows (general)

| Flow | Status | Steps |
|------|--------|-------|
| First visit → sign up | ✅ | `/` → Sign in → Sign up tab → redirect `?next=` (default `/tracker`) |
| Return visit → sign in | ✅ | `/login` auto-redirect if session exists |
| Protected route without session | ✅ | Server `getUser()` → `/login?next=<path>` |
| Discover modules from landing | ⚠️ | 6 live module cards; **Job Hunter (`/jobs`) not listed** on landing |
| Cross-module navigation via `AppNav` | ⚠️ | Tracker, Job Hunter, CV, Goals only |
| Cross-module via page headers | ✅ | Calendar ↔ Goals ↔ Tracker links; resume/jobs link in empty states |

### Landing page sections (`app/page.tsx`)

| Section | Status | Notes |
|---------|--------|-------|
| Hero + CTAs | ✅ | Links to `/login`, `/login?next=/tracker` |
| Live module cards (`corePages`) | ⚠️ | Chat, Tracker, Goals, Calendar, Tasks (`/goals#tasks`), Resume — **no Job Hunter card** |
| “Coming next” cards | ✅ | Skill gap, roadmap, cover letter studio, dashboard, AI nudges (non-clickable) |
| Proof points strip | ✅ | Static feature bullets |

---

## Pillar 1 — Job Hunter Agent

### Pages

| Page | Path | Status | Notes |
|------|------|--------|-------|
| Job Hunter | `/jobs` | ✅ | `JobsPageClient` + `AppNav` |

### Panels & components

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Page header | `jobs-page-client.tsx` | ✅ | Title “Job Hunter” |
| No-CV empty state | `jobs-page-client.tsx` | ✅ | Link to `/resume` |
| Job search form | `search-form.tsx` | ✅ | Query, location, resume picker, submit |
| Source selector | `search-form.tsx` | ⚠️ | Type supports `manual`; UI only lists **JSearch** |
| Match list | `jobs-page-client.tsx` | ✅ | Loading skeletons, empty state, error state |
| Match card | `match-card.tsx` | ⚠️ | Title, company, location, fit %, explanation, matched/missing skills, external link, save — **no salary or deadline row** |
| Fit score badge | `match-card.tsx` | ✅ | Color by score tier |
| Resume selector | `search-form.tsx` | ✅ | Dropdown of user resumes |

### Modals / drawers

| UI | Status | Notes |
|----|--------|-------|
| Manual job paste modal / drawer | ❌ | API `addManualJob()` exists; no form UI |
| Job detail modal | ❌ | Full JD view only via external “View posting” link |
| Fit score breakdown modal | ❌ | Explanation inline only |

### User flows

| Flow | Status | Steps |
|------|--------|-------|
| Search jobs with NL query | ✅ | Pick resume → enter query (+ location) → Search → toast with count → match cards |
| View fit & reasoning | ⚠️ | Read `explanation` + skill chips on card; no dedicated “why” panel |
| Save job to tracker | ✅ | “Save to Tracker” on `MatchCard` → Kanban `saved` column |
| Open original posting | ✅ | “View posting” when `source_url` present |
| Search without CV | ✅ | Blocked with amber banner + link to upload |
| Paste JD for fit (manual) | ❌ | No UI |
| Filter/sort matches | ❌ | List order from API only |
| View past searches | ❌ | No search history UI |

---

## Pillar 2 — Profile & Resume Intelligence (RAG Core)

### Pages

| Page | Path | Status | Notes |
|------|------|--------|-------|
| CV Intelligence | `/resume` | ✅ | `ResumePageClient` + `AppNav` |
| In-app CV builder | ❌ | Upload-only |

### Panels & components

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Page header + status badge | `resume-page-client.tsx` | ✅ | `no_cv` / `processing` / `failed` / `rag_ready` |
| Multi-resume selector | `resume-page-client.tsx` | ✅ | Shown when >1 resume |
| Upload card (drag-and-drop) | `resume-upload-card.tsx` | ✅ | PDF/DOCX, drag state, file clear, upload progress strip |
| Upload validation errors | `resume-upload-card.tsx` | ✅ | Client-side before API |
| Resume summary | `resume-summary.tsx` | ✅ | Skeleton, sections (expand/collapse), skills by category, delete |
| Delete resume | `resume-summary.tsx` | ✅ | `confirm()` + mutation + toast |
| Failed / re-upload CTA | `resume-summary.tsx` | ✅ | Scroll to upload card |
| Ask about CV panel | `resume-answer-box.tsx` | ✅ | Textarea, sample question chips, answer + evidence |
| Evidence cards (CV page) | `resume-answer-box.tsx` | ✅ | Similarity bars, expand chunk text |
| Semantic query box (debug) | `resume-query-box.tsx` | ❌ | **Component exists but not mounted** on `/resume` |
| Chunk evidence card (shared) | `chunk-evidence-card.tsx` | ✅ | Used in chat messages |
| Sign out | `resume-page-client.tsx` | ✅ | Header button |

### Modals / drawers

| UI | Status | Notes |
|----|--------|-------|
| Delete resume confirm | ⚠️ | Native `confirm()` in summary |
| Upload preview modal | ❌ | File name only inline |
| Section full-screen viewer | ❌ | Inline expand only |

### User flows

| Flow | Status | Steps |
|------|--------|-------|
| Upload CV (click) | ✅ | Select file → Upload → processing toast → summary refreshes |
| Upload CV (drag-and-drop) | ✅ | Drop zone on upload card |
| View parsed sections & skills | ✅ | Expand sections; category-colored skill chips |
| Ask grounded question about CV | ✅ | Pick/enter question → Ask → answer + collapsible evidence |
| Switch active resume | ✅ | Dropdown when multiple resumes |
| Delete CV | ✅ | Trash → confirm → list refresh |
| Recover from failed parse | ✅ | Error state + re-upload scroll |
| Raw semantic chunk search | ❌ | `ResumeQueryBox` not on page |
| Build CV in browser | ❌ | Not implemented |

---

## Pillar 3 — Personal AI Assistant

### Pages

| Page | Path | Status | Notes |
|------|------|--------|-------|
| AI Career Assistant | `/chat` | ✅ | `ChatWorkspace` — sidebar + thread |
| Skill Gap Analysis page | ❌ | Landing “coming next” only |
| Cover Letter Studio page | ❌ | Chat + save action only |
| Roadmap viewer page | ❌ | Chat + save action only |

### Panels & components

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Conversation sidebar | `ConversationSidebar.tsx` | ✅ | List, new chat, delete, loading/error |
| Chat thread | `ChatThread.tsx` | ✅ | Messages, empty states, auto-scroll |
| Message bubbles | `ChatMessage.tsx` | ✅ | User plain text; assistant Markdown |
| Streaming composer | `MessageComposer.tsx` | ✅ | Disabled when no conversation; send while streaming |
| Suggested prompts (empty thread) | `ChatThread.tsx` | ⚠️ | Generic prompts — **not** benchmark-specific (readiness, gap, roadmap, cover letter) |
| No-CV banner | `ChatMessage.tsx` | ✅ | Links to `/resume` |
| CV evidence section in reply | `ChatMessage.tsx` | ✅ | Collapsible `ChunkEvidenceCard` list |
| Save Cover Letter action | `ChatMessage.tsx` | ✅ | Button when `can_save_cover_letter` metadata |
| Save Roadmap action | `ChatMessage.tsx` | ✅ | Button when `can_save_roadmap` metadata |
| Intent badge / label in UI | ❌ | Intent stored in metadata but not shown to user |
| Phase badge | `ChatThread.tsx` | ⚠️ | “Phase 2.2” label (dev placeholder) |

### Modals / drawers

| UI | Status | Notes |
|----|--------|-------|
| Delete conversation confirm | ⚠️ | `confirm()` in `ChatWorkspace` |
| New conversation naming | ❌ | Default title “New conversation”; no rename UI |
| JD paste side panel for readiness | ❌ | User must paste role/JD in free text |

### User flows

| Flow | Status | Steps |
|------|--------|-------|
| Create conversation | ✅ | Sidebar “New” → temp ID → persisted on first message |
| Select conversation | ✅ | Sidebar click → load messages |
| Send message (streaming) | ✅ | Composer → `POST /api/assistant/chat` SSE → tokens render live |
| Multi-turn memory in session | ✅ | Last 12 messages loaded server-side |
| Readiness check (“Am I ready for…”) | ⚠️ | Works via free-text + intent routing; no guided form |
| Skill gap analysis | ⚠️ | Chat response only; **no dedicated results page** or save-from-chat for gap |
| Roadmap generation | ⚠️ | Chat markdown plan → optional **Save Roadmap** → backend persist; **no viewer** |
| Cover letter draft | ⚠️ | Chat letter → optional **Save Cover Letter**; **no studio/editor** |
| View saved cover letters / roadmaps | ❌ | No list/history UI |
| Delete conversation | ✅ | Sidebar delete + confirm |
| Chat without CV | ⚠️ | Allowed with warning banner; grounded quality limited |

---

## Pillar 4 — Productivity & Progress Tracker

### Pages

| Page | Path | Status | Notes |
|------|------|--------|-------|
| Application Tracker (Kanban) | `/tracker` | ✅ | `TrackerBoard` + `AppNav` |
| Goals | `/goals` | ✅ | `GoalsWorkspace` + `AppNav` |
| Standalone tasks (section) | `/goals#tasks` | ✅ | `TaskList` has `id="tasks"` (right column) |
| Calendar | `/calendar` | ✅ | `CalendarView` — own header, no `AppNav` |
| Progress dashboard | ❌ | Landing placeholder only |
| AI nudges UI | ❌ | Not built |

### Panels & components — Tracker

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Kanban board (5 columns) | `tracker-board.tsx` | ✅ | saved → applied → interviewing → offer → rejected |
| Drag-and-drop status change | `tracker-board.tsx` | ✅ | `@hello-pangea/dnd` + optimistic update |
| Application card | `application-card.tsx` | ✅ | Title, company, deadline preview |
| Kanban column | `kanban-column.tsx` | ✅ | Droppable + count |
| Add application button | `tracker-board.tsx` | ✅ | Opens add drawer |
| Link to calendar | `tracker-board.tsx` | ✅ | Header icon link |
| Status filter via URL | `tracker/page.tsx` | ⚠️ | `?status=` supported in types/hooks if passed — verify UX exposure |
| Sign out | `tracker-board.tsx` | ✅ | |

### Modals / drawers — Tracker

| UI | File | Status | Notes |
|----|------|--------|-------|
| Add application drawer | `add-application-drawer.tsx` | ✅ | Manual job title, company, location, deadline, notes |
| Application detail drawer | `application-detail-drawer.tsx` | ✅ | Edit fields, status dropdown, history timeline, delete |
| Delete application confirm | `application-detail-drawer.tsx` | ⚠️ | Native `confirm()` |

### User flows — Tracker

| Flow | Status | Steps |
|------|--------|-------|
| Add manual application | ✅ | Add → drawer form → submit → card in `saved` |
| Move card via drag-and-drop | ✅ | Drag column → status RPC + history note |
| Open application details | ✅ | Click card → drawer → edit / change status |
| View status history | ✅ | Timeline in detail drawer |
| Delete application | ✅ | Drawer delete + confirm |
| Add from Job Hunter save | ✅ | Starts in `saved` via match save (cross-pillar) |

### Panels & components — Goals & tasks

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Goals list + status filters | `goals-workspace.tsx` | ✅ | All / active / completed / paused / cancelled |
| Goal card | `goal-card.tsx` | ✅ | Progress bar, expand tasks, status actions, edit |
| Goal-linked task list | `task-list.tsx` (feature) | ✅ | Inside expanded goal card |
| Goal task row | `task-row.tsx` | ✅ | Toggle done, edit inline, delete |
| Goal task form | `task-form.tsx` | ✅ | Inline create/edit under goal |
| Standalone task list | `components/tasks/TaskList.tsx` | ✅ | Buckets: overdue / today / week / later |
| Task filters | `TaskList.tsx` | ✅ | All / today / week / overdue |
| Task quick add | `TaskQuickAdd.tsx` | ✅ | |
| Task item | `TaskItem.tsx` | ✅ | Edit, complete, delete, priority, due date |
| Bulk select complete/delete | `TaskList.tsx` | ✅ | Checkbox selection |
| Goal progress % | `goal-card.tsx` | ✅ | Per-goal task completion bar |

### Modals / drawers — Goals

| UI | File | Status | Notes |
|----|------|--------|-------|
| Goal create/edit drawer | `goal-form-drawer.tsx` | ✅ | Title, description, status, target date |
| Cancel goal confirm | `goal-card.tsx` | ⚠️ | Native `confirm()` |
| Task delete confirm | `task-row.tsx` | ⚠️ | Native `confirm()` |

### User flows — Goals & tasks

| Flow | Status | Steps |
|------|--------|-------|
| Create / edit goal | ✅ | Add Goal → drawer → save |
| Filter goals by status | ✅ | Tab buttons |
| Add task under goal | ✅ | Expand goal → task form |
| Complete / edit / delete goal task | ✅ | `TaskRow` actions |
| Standalone task CRUD | ✅ | Right column on `/goals` |
| Jump to tasks from landing | ✅ | `/goals#tasks` scrolls to `TaskList` |
| Link task to roadmap item | ❌ | DB field exists; no UI |
| Link task to application | ❌ | DB field exists; limited UI |

### Panels & components — Calendar

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Month / week / day views | `CalendarView.tsx` | ✅ | `react-big-calendar` |
| Upcoming sidebar | `UpcomingSidebar.tsx` | ✅ | Next events list |
| Application deadline events (read-only) | `useCalendarEvents.ts` | ✅ | Synthesized from tracker |
| Event type color coding | `CalendarView.tsx` | ✅ | deadline, interview, reminder, study, etc. |
| Add event button | `CalendarView.tsx` | ✅ | Opens modal |
| Header links (Goals, Tracker) | `CalendarView.tsx` | ✅ | |
| Sign out | `CalendarView.tsx` | ✅ | |

### Modals / popovers — Calendar

| UI | File | Status | Notes |
|----|------|--------|-------|
| Event create/edit modal | `EventModal.tsx` | ✅ | Title, type, times, reminder, description |
| Event quick view popover | `EventPopover.tsx` | ✅ | View / edit / delete (non-read-only events) |
| Delete event confirm | `EventPopover.tsx` | ⚠️ | Native `confirm()` |
| Read-only application deadline popover | `EventPopover.tsx` | ✅ | Cannot edit/delete synthetic events |

### User flows — Calendar

| Flow | Status | Steps |
|------|--------|-------|
| Create custom event | ✅ | Add / slot select → modal → save (Supabase direct) |
| Edit / delete event | ✅ | Click event → popover → edit modal or delete |
| See application deadlines on calendar | ✅ | Auto-imported from applications |
| Set reminder time on event | ✅ | Field in `EventModal` — **no push notification delivery** |
| Link event to task or application | ⚠️ | Fields in modal if exposed — optional linking |
| Create event from roadmap item | ❌ | No UI |

### Dashboard & nudges (Pillar 4 — missing)

| UI | Status | Notes |
|----|--------|-------|
| `/dashboard` page | ❌ | — |
| Weekly applications chart | ❌ | — |
| Skills added widget | ❌ | — |
| Roadmap % complete widget | ❌ | — |
| Streak counter | ❌ | — |
| AI nudge toast / banner / inbox | ❌ | — |
| “3 jobs matching your profile” prompt | ❌ | — |

---

## Others — Cross-cutting & planned UI

### Navigation consistency

| Item | Status | Notes |
|------|--------|-------|
| `AppNav` includes Job Hunter | ✅ | `/jobs` link present |
| `AppNav` includes Chat | ❌ | Chat only via landing / direct URL |
| `AppNav` includes Calendar | ❌ | Calendar via goals header or direct URL |
| Landing lists Job Hunter | ❌ | Missing from `corePages` |
| Brand logo target | ⚠️ | `AppNav` logo → `/tracker` not `/` |

### Shared UX patterns

| Pattern | Status | Notes |
|---------|--------|-------|
| Loading skeletons | ✅ | Jobs, goals, chat, resume |
| Inline error panels | ✅ | Red bordered messages per feature |
| Empty states with CTA | ✅ | Most lists |
| Sonner success/error toasts | ✅ | Upload, search, save match, etc. |
| Custom event toasts (`careerpilot-toast`) | ⚠️ | Some hooks use DOM event; most use Sonner |
| Markdown rendering | ✅ | Assistant messages (`react-markdown`) |
| Accessibility (ARIA on drawers) | ⚠️ | Partial; drawer close buttons labeled |

### Planned UI (landing “Coming next” — no routes)

| Feature | Dedicated page | In-chat only | Status |
|---------|----------------|--------------|--------|
| Skill Gap Analysis | ❌ | ⚠️ intent | ❌ / ⚠️ |
| Roadmap Generator | ❌ | ⚠️ + save btn | ❌ / ⚠️ |
| Cover Letter Studio | ❌ | ⚠️ + save btn | ❌ / ⚠️ |
| Progress Dashboard | ❌ | — | ❌ |
| AI Nudges | ❌ | — | ❌ |

### API route (not a page)

| Route | Status | Notes |
|-------|--------|-------|
| `POST /api/assistant/chat` | ✅ | Next.js Route Handler — streaming; not visible as UI route |

---

## End-to-end demo flows (judging video)

| Demo step | UI path | Status |
|-----------|---------|--------|
| 1. CV upload | `/resume` → upload card | ✅ |
| 2. Job search | `/jobs` → search form → match cards | ✅ |
| 3. Fit score visible | Match card badge + explanation | ✅ |
| 4. AI assistant query | `/chat` → message | ✅ |
| 5. Cover letter draft | `/chat` (cover letter intent) → optional Save | ⚠️ |
| 6. Tracker update | `/tracker` → drag card or edit drawer | ✅ |

---

## Frontend priority backlog

1. ❌ **Progress dashboard** page + nav entry  
2. ❌ **AI nudges** surface (banner, toast, or inbox)  
3. ⚠️ **Job Hunter on landing** + link Chat/Calendar in `AppNav`  
4. ⚠️ **Match card** — show `salary_range` and deadline when available  
5. ❌ **Manual job paste** drawer on `/jobs`  
6. ❌ **Dedicated pages** — skill gap, cover letters list, roadmap viewer  
7. ⚠️ **Chat suggested prompts** — benchmark queries (readiness, gap, roadmap, letter)  
8. ⚠️ **Mount or remove** `ResumeQueryBox` on `/resume`  
9. ❌ **Shared confirm modal** instead of `window.confirm`  
10. ⚠️ **Unify sign-out** on all authenticated pages (add to `/jobs` header)

---

*Re-audit after UI changes by walking each route in the running app (`docker compose up`) and updating status emojis.*
