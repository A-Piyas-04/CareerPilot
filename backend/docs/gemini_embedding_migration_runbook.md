# Gemini Embedding Migration Runbook

## 1) Configure environment
- Set `GEMINI_API_KEY`
- Set `EMBEDDING_BACKEND=gemini`
- Set `ANALYSIS_BACKEND=gemini`
- Set `GEMINI_EMBEDDING_MODEL` and `EMBEDDING_VECTOR_DIM`
- During backfill, set:
  - `EMBEDDING_ACTIVE_COLUMN=embedding_new`
  - `RETRIEVAL_REQUIRE_DIM_MATCH=true`

## 2) Apply safe schema migration
- Run Alembic migration `2b7f66d7a1b2`.
- This adds `resume_chunks.embedding_new` and index `idx_resume_chunks_embedding_new`.

## 3) Backfill embeddings
- Run: `python scripts/reembed_resume_chunks.py`
- Script is resumable and idempotent for `embedding_new`.

## 4) Verify before cutover
- Check `/health` and inspect `embedding_migration`.
- Ensure `pending` reaches `0`.
- Sample retrieval queries and validate top-k relevance.

## 5) Switch production reads
- Keep `EMBEDDING_ACTIVE_COLUMN=embedding_new` once backfill is complete.
- Continue to monitor retrieval quality and error rates.

## 6) Finalize column swap (maintenance window)
Run SQL once verified:

```sql
DROP INDEX IF EXISTS idx_resume_chunks_embedding;
ALTER TABLE resume_chunks RENAME COLUMN embedding TO embedding_old;
ALTER TABLE resume_chunks RENAME COLUMN embedding_new TO embedding;
ALTER INDEX idx_resume_chunks_embedding_new RENAME TO idx_resume_chunks_embedding;
```

After stability verification:

```sql
ALTER TABLE resume_chunks DROP COLUMN embedding_old;
```

