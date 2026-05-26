# CV Intelligence — Notes, Fixes, and Operational Lessons

> Last updated: May 26, 2026

This document records non-obvious work required to ship CV Intelligence: environment pitfalls, database permissions, embedding strategy changes, CORS debugging, and known gaps. Use it when onboarding or debugging production-like issues.

---

## 1. Database permission denied (`42501`)

### Symptom

Upload or list resumes returns HTTP 500 with a message like:

```text
permission denied for table resumes (SQLSTATE 42501)
```

Browser may show a **CORS error** even though the root cause is Postgres permissions (see §4).

### Cause

Tables were created with RLS enabled, but **table-level GRANTs** for the `service_role` / `authenticated` roles were missing for CV tables. The Supabase Python client uses PostgREST; without grants, even the service role cannot insert.

### Fix

Apply migration:

```text
supabase/migrations/20250526120000_resume_cv_grants.sql
```

```bash
npx supabase db push --db-url "postgresql://postgres:<PASSWORD>@db.<ref>.supabase.co:5432/postgres"
```

Grants:

- `resumes`, `resume_sections`, `resume_chunks`, `user_skills`
- `SELECT, INSERT, UPDATE, DELETE` for `authenticated` and `service_role`

### Code support

`backend/app/core/supabase_errors.py` maps code `42501` to an explicit client message pointing at this migration.

---

## 2. Embedding strategy: sentence-transformers → HashingVectorizer

### Original plan

- Model: `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions)
- Required: `sentence-transformers`, `torch`, ~90 MB download, `HF_TOKEN` for reliable Hugging Face access
- Problem: **slow Docker builds**, large images, cold-start latency on first upload in containers

### Decision

Switch to **scikit-learn `HashingVectorizer`** (`n_features=384`, `norm="l2"`, `alternate_sign=False`).

| Aspect | sentence-transformers | HashingVectorizer |
|---|---|---|
| Docker build | Heavy (torch) | Light (`scikit-learn` only) |
| First request | Model download | Instant |
| Semantic quality | Strong | Weaker (hashed n-grams) |
| Dimension match | 384 | 384 (same `vector(384)` column) |

Documented in team note: `Docs/embedding.txt` — *"used scikit-learn instead of sentence-transformers for faster docker build"*.

### Implications

- Retrieval still works for **keyword-overlap** style queries (skills, technologies named in CV).
- Synonym queries ("ML" vs "machine learning") work less reliably than with a transformer.
- `HF_TOKEN` in `.env.example` is **legacy**; not required for current pipeline.
- Tests in `test_embedding_service.py` were updated for HashingVectorizer behavior (dimension, cosine sanity).

### If you revert to transformers

1. Add `sentence-transformers` to `requirements.txt`
2. Replace `embedding_service.py` implementation
3. Keep `EMBEDDING_DIM = 384` or alter migration / re-embed all chunks
4. Set `HF_TOKEN` and pre-download model in Docker image for production

---

## 3. pgvector RPC not deployed

### Symptom

Logs show:

```text
pgvector RPC match_resume_chunks unavailable, using numpy fallback
```

### Cause

`retrieval_service.py` calls RPC functions that are **not** created in any migration file. Initial schema only adds the `embedding` column and IVFFlat index.

### Current behavior

**Acceptable for hackathon scale:** fetch all user chunks (optionally filtered by `resume_id`), rank in Python with numpy cosine similarity.

### When to add RPC

For large chunk counts, add a migration similar to:

```sql
create or replace function match_resume_chunks(
  query_embedding vector(384),
  match_user_id uuid,
  match_count int
)
returns table (
  id uuid,
  resume_id uuid,
  section_name text,
  chunk_text text,
  similarity float
)
language sql stable
as $$
  select
    rc.id,
    rc.resume_id,
    rc.section_name,
    rc.chunk_text,
    1 - (rc.embedding <=> query_embedding) as similarity
  from resume_chunks rc
  where rc.user_id = match_user_id
  order by rc.embedding <=> query_embedding
  limit match_count;
$$;
```

Grant `execute` to `service_role`. Mirror with `match_resume_id` parameter for scoped search.

---

## 4. CORS errors masking real failures

### Symptom

Frontend `fetch` to `http://localhost:8000/api/v1/resumes/upload` fails with a generic CORS message; no JSON body.

### Cause

When FastAPI raises an unhandled exception or returns an error **without** `Access-Control-Allow-Origin`, the browser reports CORS failure instead of the real 500/403 body.

### Fix (implemented)

`backend/main.py` registers:

- `@app.exception_handler(HTTPException)` — adds CORS headers from allowed origins
- `@app.exception_handler(Exception)` — returns 500 JSON with CORS headers

Ensure `CORS_ORIGINS` includes your frontend origin (default `http://localhost:3000`).

---

## 5. `SUPABASE_URL` must be the bare project URL

### Symptom

Auth or DB calls fail with malformed URL errors.

### Fix

Use:

```text
https://<project-ref>.supabase.co
```

**Not:**

```text
https://<project-ref>.supabase.co/rest/v1/
```

The `supabase-py` client appends `/rest/v1` itself. This is called out in README known issues.

---

## 6. Service role + ownership enforcement

The backend **never** uses the user's JWT for database writes. Pattern:

1. Validate JWT → extract `user_id`
2. Use `SUPABASE_SERVICE_ROLE_KEY` client
3. Every query includes `.eq("user_id", user_id)`

RLS protects direct client access; the service role bypasses RLS, so **Python must enforce ownership** on every path. Missing `.eq("user_id")` would be a serious bug.

---

## 7. Upload pipeline partial failure

### Behavior

1. Resume row inserted early with `status=processing`
2. Any later failure → `_mark_failed()` sets `status=failed` and `error_message`
3. UI shows error in `ResumeSummary` when `status === "failed"`

### Operational notes

- Re-upload creates a **new** resume row; old rows remain unless deleted manually
- Only the latest successful upload is `is_active=true` (others deactivated)
- Failed rows still appear in resume list — consider cleanup UX later

### Scanned PDFs

`extract_text` returns empty for image-only PDFs → **422** with message asking for selectable text. Not a bug; OCR is out of scope.

---

## 8. Chunk list endpoint omits embeddings

`get_resume_chunks` SELECT list intentionally **excludes** `embedding` to keep payloads small. Full vectors are only loaded server-side during retrieval fallback.

---

## 9. Frontend integration checklist

| Check | Detail |
|---|---|
| `NEXT_PUBLIC_API_URL` | Must point to backend (e.g. `http://localhost:8000`) |
| User signed in | `apiRequest` throws if no session |
| Processed before RAG | Query box disabled until `status === "processed"` |
| Multipart upload | Do not set `Content-Type` manually on `FormData` |
| Snake_case body | `resume_id`, `top_k` in JSON query payload |

---

## 10. Docker / Windows dev

| Issue | Mitigation |
|---|---|
| Next.js file watch in Docker on Windows | `WATCHPACK_POLLING=true`, `CHOKIDAR_USEPOLLING=true` in `docker-compose.yml` |
| Backend hot reload | Volume mount `./backend:/app` |
| No GPU needed | HashingVectorizer runs on CPU only |

---

## 11. Dependencies removed vs added

**Removed from active CV path:**

- `sentence-transformers`, `torch`, Hugging Face hub downloads

**Added / required:**

- `scikit-learn` — embeddings
- `numpy` — retrieval fallback
- `pypdf`, `python-docx` — parsing

Run `pip install -r requirements.txt` after pulling.

---

## 12. Testing gotchas

| Topic | Note |
|---|---|
| `reportlab` | Optional; one PDF round-trip test skipped without it |
| Embedding tests | Fast (~2s total suite); no network |
| Full suite | `pytest test/CV-intelligence/` → 95 passed, 1 skipped |
| Integration | No automated test against live Supabase; manual curl/UI test required |

**Manual smoke test:**

1. Sign up / login
2. Open `/resume`
3. Upload a text-based PDF or DOCX
4. Confirm sections, skills, chunk count
5. Run RAG query — expect ranked chunks with similarity %

---

## 13. Known gaps (not bugs)

| Gap | Impact |
|---|---|
| No Supabase Storage upload | `file_url` always null; cannot re-download original file |
| No `match_resume_chunks` SQL | RPC path unused; Python fallback only |
| HashingVectorizer semantics | Weaker paraphrase matching |
| No global nav to `/resume` | User must know URL (home → `/tracker`) |
| `user_skills` upsert | `ignore_duplicates=True` — updating evidence on re-upload may not refresh existing skills |
| IVFFlat index | May need `REINDEX` / lists tuning at very large scale |

---

## 14. Quick troubleshooting flowchart

```text
Upload fails
├── Browser "CORS" only?
│   └── Check backend logs; fix grants (§1) or URL (§5); CORS handlers (§4)
├── 422 Unprocessable?
│   └── File type / size / empty extracted text (scanned PDF)
├── 401?
│   └── Re-login; verify Bearer token in apiRequest
├── 500 + grants message?
│   └── Apply 20250526120000_resume_cv_grants.sql
└── 500 other?
    └── Backend logs; supabase_errors detail; chunk insert / embedding shape

RAG returns empty
├── resume status processed?
├── Chunks exist? (chunk_count > 0)
└── Query too unrelated? (try skill names from CV)
```

---

## 15. Related files

| File | Why it matters |
|---|---|
| `supabase/migrations/20250526120000_resume_cv_grants.sql` | Permission fix |
| `backend/app/core/supabase_errors.py` | Error mapping |
| `backend/main.py` | CORS on errors |
| `backend/app/cv_intelligence/services/embedding_service.py` | HashingVectorizer |
| `backend/app/cv_intelligence/services/retrieval_service.py` | RPC + fallback |
| `Docs/embedding.txt` | One-line decision record |
| `Docs/cv-intelligence-implementation.md` | Full architecture reference |
