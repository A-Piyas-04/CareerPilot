
    "status": "saved"
  }'
```
#### Example — list applications
```bash
curl http://localhost:8000/api/v1/applications \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```
#### Example — change status
```bash
APP_ID="<application-uuid>"
curl -X PATCH http://localhost:8000/api/v1/applications/$APP_ID/status \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"new_status": "applied"}'
```
---
## API Reference
Base URL: `http://localhost:8000`
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | Health check |
| `GET` | `/health` | — | Health check |
| `GET` | `/api/v1/applications` | Bearer | List user's applications (optional `?status_filter=`) |
| `POST` | `/api/v1/applications` | Bearer | Create a manual application |
| `GET` | `/api/v1/applications/{id}` | Bearer | Get application detail + status history |
| `PATCH` | `/api/v1/applications/{id}` | Bearer | Update fields (notes, deadline, title, etc.) |
| `PATCH` | `/api/v1/applications/{id}/status` | Bearer | Change status (writes history atomically) |
| `DELETE` | `/api/v1/applications/{id}` | Bearer | Delete application |
Full Swagger docs: `http://localhost:8000/docs`
---
## Database Migrations
Migrations live in `supabase/migrations/` and are applied in filename order.
| Migration | Description |
|---|---|
| `20250525_001_initial_schema.sql` | All tables, enums, RLS policies, indexes, triggers |
| `20250525153000_kanban_manual_applications.sql` | Manual application columns + `change_application_status` RPC |
To apply after making changes:
```bash
npx supabase db push
```
---
## What's Coming Next
See [`Docs/present-state.md`](Docs/present-state.md) for the full implementation matrix. Planned modules:
- **CV Intelligence** — Resume upload, AI parsing, vector search
- **Job Intelligence** — Job search, scraping, match scoring
- **AI Career Assistant** — Claude-powered chat, cover letter generation
- **Roadmaps, Goals & Tasks** — Career path planning
- **Calendar** — Interview scheduling and deadline tracking
- **Skill Gap Analysis** — Target role readiness assessment
---
## Team
CareerPilot was built for CodeSprint 2 hackathon. The codebase is split across three feature modules (CV Intelligence, Job Intelligence, Career Assistant) with shared infrastructure (auth, database, core models).
