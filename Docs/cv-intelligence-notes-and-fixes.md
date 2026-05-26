# CV Intelligence — Notes, Fixes, and Operational Lessons

> Last updated: May 26, 2026

This document records all non-obvious work required to ship CV Intelligence: environment pitfalls, database permissions, embedding strategy, LLM integration, CORS debugging, and known remaining gaps. Use when onboarding or debugging production-like issues.

---

## 1. Database permission denied (`42501`)

### Symptom

Upload or list resumes returns HTTP 500:

```text
permission denied for table resumes (SQLSTATE 42501)
```

Browser may show a **CORS error** — see §5 for why CORS masks the real cause.

### Cause

Tables were created with RLS enabled, but **table-level GRANTs** for `service_role` / `authenticated` were missing for CV tables. The Supabase Python client uses PostgREST; without grants, even the service role cannot insert.

### Fix

Apply migration `supabase/migrations/20250526120000_resume_cv_grants.sql`:

```bash
npx supabase db push
# or paste the SQL directly in Supabase Dashboard → SQL Editor
```

Grants: `SELECT, INSERT, UPDATE, DELETE` on `resumes`, `resume_sections`, `resume_chunks`, `user_skills` for both `authenticated` and `service_role`.

### Code support

`backend/app/core/supabase_errors.py` maps code `42501` to an explicit client message pointing at this migration.

---

## 2. Embedding strategy

### Current implementation

Two backends selectable via `EMBEDDING_BACKEND` environment variable:

| Backend | `EMBEDDING_BACKEND` value | Quality | Docker build | Notes |
|---|---|---|---|---|
| `HashingVectorizer` | `hashing` (default) | Bag-of-words, keyword-overlap only | Light (sklearn only) | Deterministic, no download |
| `sentence-transformers` | `transformers` | Semantic, synonym-aware | Heavy (~90 MB model) | `pip install sentence-transformers` required |

Both produce 384-dim L2-normalized vectors stored in `resume_chunks.embedding vector(384)`. **No migration is needed to switch backends** — the column type is the same.

### History

The original plan was `sentence-transformers/all-MiniLM-L6-v2`. This was replaced with `HashingVectorizer` as the default to avoid slow Docker builds and cold-start latency in hackathon containers. sentence-transformers was later added back as an opt-in backend.

### When to use `transformers`

Switch to `transformers` when query quality matters more than build speed — e.g. queries like "ML experience" should match "machine learning" and "deep learning" in the CV. In production, pre-download the model in the Dockerfile:

```dockerfile
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

### Changing `HF_TOKEN`

Not required for `all-MiniLM-L6-v2` (public model). Only set `HF_TOKEN` if using a gated model.

---

## 3. pgvector RPC — deployed

### Status: resolved

`supabase/migrations/20250526130000_pgvector_rpc.sql` defines both RPC functions. Apply with:

```bash
npx supabase db push
# or paste SQL in Supabase Dashboard → SQL Editor
```

### What was the issue

`retrieval_service.py` calls `match_resume_chunks` / `match_resume_chunks_with_resume`. These were referenced in code but not in any migration. The Python/numpy fallback handled this transparently (with a log warning), but it fetched **all** user chunks — O(n) instead of O(log n).

### Current behavior after fix

1. RPC is tried first — uses IVFFlat with `ivfflat.probes = 10` (set inside function body)
2. On RPC failure (e.g. function not yet applied) — numpy cosine fallback
3. Both paths apply `min_similarity = 0.05` filter

### RPC function signatures

```sql
match_resume_chunks(
  query_embedding  vector(384),
  match_user_id    uuid,
  match_count      int default 5
)

match_resume_chunks_with_resume(
  query_embedding  vector(384),
  match_user_id    uuid,
  match_resume_id  uuid,
  match_count      int default 5
)
```

Both return `(id, resume_id, section_name, chunk_text, similarity)`.

---

## 4. LLM grounded answers (`/answer` endpoint)

### Setup

Set `ANTHROPIC_API_KEY` in `backend/.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

The `/answer` endpoint will return a clear fallback message (not a 500) when the key is missing, so the app remains functional without AI answers.

### How grounding works

`llm_service.py` builds a prompt from retrieved CV chunks:

```
System: You are CareerPilot. Answer ONLY from the CV excerpts provided.
        Never invent experience not in the excerpts. If you can't find the
        answer, say so honestly.

User:   [Excerpt 1 — experience]
        ... text ...

        [Excerpt 2 — skills]
        ... text ...

        Question: What are my strongest technical skills?
```

Context limits: 600 chars per chunk, 6000 chars total context. Model: `claude-3-haiku-20240307` (fast, low cost). Max output: 512 tokens.

### What to watch for

- **Hallucination:** The system prompt prevents it but is not 100% foolproof with low-similarity chunks. Ensure the query retrieves genuinely relevant chunks.
- **Empty context:** If `search_chunks` returns nothing (all below `min_similarity`), `llm_service` returns the `_NO_CHUNKS_MSG` fallback without calling Claude.
- **Rate limits:** Haiku has generous rate limits for hackathon use. Switch to `claude-3-sonnet` for better reasoning on complex questions.

---

## 5. CORS errors masking real failures

### Symptom

Frontend `fetch` fails with a generic CORS browser error; no JSON body visible in DevTools.

### Cause

When FastAPI returns an error response without `Access-Control-Allow-Origin`, the browser reports CORS failure instead of the real 4xx/5xx body.

### Fix (already implemented)

`backend/main.py` registers:

```python
@app.exception_handler(HTTPException)   # adds CORS headers
@app.exception_handler(Exception)       # returns 500 JSON + CORS headers
```

Ensure `CORS_ORIGINS` in `.env` includes your frontend origin (default: `http://localhost:3000`).

---

## 6. `SUPABASE_URL` must be the bare project URL

### Fix

Use:
```text
https://<project-ref>.supabase.co
```

**Not:**
```text
https://<project-ref>.supabase.co/rest/v1/
```

The `supabase-py` client appends `/rest/v1` internally. The extra suffix causes malformed URL errors.

---

## 7. Service role + ownership enforcement

The backend **never** uses the user's JWT for database writes. Pattern:

1. Validate JWT → extract `user_id` via `get_current_user()`
2. Use `SUPABASE_SERVICE_ROLE_KEY` client (bypasses RLS)
3. Every query includes `.eq("user_id", user_id)`

RLS protects direct client access. Missing `.eq("user_id")` on any write/read path would be a serious security bug.

---

## 8. Upload pipeline partial failure

### Behavior

1. Resume row inserted early with `status=processing`
2. Any later failure → `_mark_failed()` sets `status=failed` + `error_message`
3. UI shows error banner + "Upload a new file" button in `ResumeSummary`

### Operational notes

- Re-upload creates a **new** resume row; old rows remain unless deleted via `DELETE /{id}`
- Only the latest successful upload has `is_active=true`
- Failed rows appear in the resume list — user can delete them via the UI's delete button

### Scanned PDFs

`extract_text` returns empty for image-only PDFs → **422** with user-friendly message. Not a bug; OCR is out of scope.

---

## 9. Delete resume

`DELETE /api/v1/resumes/{id}` was added in the May 2026 refactor.

- Backend: `resume_service.delete_resume()` — ownership check → Postgres cascade removes sections and chunks; `user_skills.resume_id` set to NULL
- Frontend: `useDeleteResume()` mutation — shows confirmation dialog; fires `toast.success("Resume deleted.")`

---

## 10. Shared Supabase response helpers

`_rows()` and `_row()` were previously duplicated in `resume_service.py` and `retrieval_service.py`. They are now in a single module:

```
backend/app/cv_intelligence/services/_helpers.py
```

Both service files import from there. If you add new CV services, import from `_helpers` rather than copying.

---

## 11. Frontend integration checklist

| Check | Detail |
|---|---|
| `NEXT_PUBLIC_API_URL` | Must point to backend (e.g. `http://localhost:8000`) |
| User signed in | `apiRequest` throws `"You need to sign in again."` if no session |
| Answer box enabled | Disabled until `resume.status === "processed"` |
| Multipart upload | Do not set `Content-Type: multipart/form-data` manually — browser sets the boundary |
| Snake_case body | `resume_id`, `top_k` in all JSON payloads |
| Delete cascade | After delete, React Query invalidates the list; UI switches to the next resume or shows empty state |
| Toast provider | `Toaster` is in `app/providers.tsx` — do not add a second instance |

---

## 12. Global navigation

`AppNav` (`frontend/src/components/nav/AppNav.tsx`) is added to each authenticated page:

```tsx
// app/resume/page.tsx (and /tracker, /goals)
return (
  <>
    <AppNav />
    <ResumePageClient />
  </>
);
```

The home route (`/`) redirects to `/tracker`. If you add more authenticated pages, wrap them the same way.

---

## 13. Docker / Windows dev

| Issue | Mitigation |
|---|---|
| Next.js file watch in Docker on Windows | `WATCHPACK_POLLING=true`, `CHOKIDAR_USEPOLLING=true` in `docker-compose.yml` |
| Backend hot reload | Volume mount `./backend:/app`; add `--reload` to uvicorn command in `docker-compose.yml` for dev |
| sentence-transformers cold start | Pre-download in Dockerfile (see §2); or keep `EMBEDDING_BACKEND=hashing` for containers |
| No GPU needed | HashingVectorizer and Claude run on CPU only |

---

## 14. Dependencies summary

**Added in May 2026 refactor:**

- `anthropic` — Claude LLM integration (in `requirements.txt`)
- `sonner` (frontend) — toast notifications

**Intentionally NOT in `requirements.txt`:**

- `sentence-transformers` — pulls PyTorch + NVIDIA CUDA packages (~2 GB); times out Docker builds. Install manually only when setting `EMBEDDING_BACKEND=transformers`:

```bash
pip install sentence-transformers
```

**Removed from active default path:**

- `torch` — not required for hashing backend
- Direct Hugging Face model download on startup

Run after pulling:

```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

---

## 15. Testing gotchas

| Topic | Note |
|---|---|
| `reportlab` | Optional; one PDF round-trip test skipped without it |
| Embedding tests | Cover both `embed_text` (single) and `embed_batch`; cosine sanity check |
| Full suite | `pytest test/CV-intelligence/ -v` → 95 passed, 1 skipped |
| Integration | No automated test against live Supabase; manual smoke test required |

### Manual smoke test

1. Sign up / login
2. Open `/resume`
3. Upload a text-based PDF or DOCX
4. Confirm sections, skills, chunk count in `ResumeSummary`
5. Ask "What are my strongest skills?" in `ResumeAnswerBox` — expect an AI answer + evidence chunks
6. Delete the resume via the delete button — confirm toast and UI updates

---

## 16. Known remaining gaps

| Gap | Impact | Priority |
|---|---|---|
| No Supabase Storage upload | `file_url` always null; cannot re-download original file | Medium |
| `user_skills` upsert with `ignore_duplicates=True` | Existing skill `evidence` not refreshed on re-upload | Low |
| `sentence-transformers` cold start | First request slow when `EMBEDDING_BACKEND=transformers` without pre-download | Low |
| IVFFlat index probes | Default probes set inside RPC (10); direct numpy fallback ignores this tuning | Low |
| Proficiency inference | Skill list is static ~50 keywords; no proficiency detected | Low |

---

## 17. Troubleshooting flowchart

```text
Upload fails
├── Browser shows "CORS" only?
│   └── Check backend logs; fix grants (§1) or SUPABASE_URL (§6); CORS handlers (§5)
├── 422 Unprocessable?
│   └── File type / size / empty extracted text (scanned PDF)
├── 401?
│   └── Re-login; verify Bearer token in apiRequest
├── 500 + "Database permission denied"?
│   └── Apply 20250526120000_resume_cv_grants.sql
└── 500 other?
    └── Backend logs; supabase_errors detail; chunk insert / embedding shape

AI answer returns fallback message
├── ANTHROPIC_API_KEY set?  (check backend/.env)
├── Package installed?  (pip install anthropic)
└── Chunks found?  (chunk_count > 0 in summary; try different question)

RAG search returns empty
├── resume status "processed"?
├── chunk_count > 0?
├── query too abstract? (try skill names verbatim from the CV)
└── min_similarity too high? (lower in retrieval_service.MIN_SIMILARITY)

pgvector RPC warning in logs
└── Apply 20250526130000_pgvector_rpc.sql
    (Python fallback still works; this is a performance fix)
```

---

## 18. Related files

| File | Why it matters |
|---|---|
| `supabase/migrations/20250526120000_resume_cv_grants.sql` | Permission fix — must be applied |
| `supabase/migrations/20250526130000_pgvector_rpc.sql` | pgvector RPC — apply for O(log n) retrieval |
| `backend/app/core/supabase_errors.py` | PostgREST → HTTP error mapping |
| `backend/main.py` | CORS on all errors |
| `backend/app/cv_intelligence/services/embedding_service.py` | Dual-backend embeddings |
| `backend/app/cv_intelligence/services/retrieval_service.py` | RPC + fallback + min_similarity |
| `backend/app/cv_intelligence/services/llm_service.py` | Anthropic Claude grounded answers |
| `backend/app/cv_intelligence/services/_helpers.py` | Shared Supabase response helpers |
| `frontend/src/features/resume/resume-answer-box.tsx` | AI answer UI |
| `frontend/src/components/nav/AppNav.tsx` | Global navigation |
| `Docs/cv-intelligence-implementation.md` | Full architecture reference |
