-- pgvector semantic search RPC functions for CV Intelligence.
-- Called by retrieval_service.py; when present, Python/numpy fallback is skipped
-- and retrieval uses the IVFFlat index — O(log n) instead of O(n).

-- ─── match_resume_chunks ───────────────────────────────────────────────────
-- Returns top-k chunks across ALL resumes owned by match_user_id.
create or replace function match_resume_chunks(
  query_embedding  vector(384),
  match_user_id    uuid,
  match_count      int default 5
)
returns table (
  id           uuid,
  resume_id    uuid,
  section_name text,
  chunk_text   text,
  similarity   float
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Tune IVFFlat recall (10 probes is a good balance for small-to-medium datasets).
  perform set_config('ivfflat.probes', '10', true);

  return query
  select
    rc.id,
    rc.resume_id,
    rc.section_name,
    rc.chunk_text,
    (1 - (rc.embedding <=> query_embedding))::float as similarity
  from resume_chunks rc
  where rc.user_id = match_user_id
    and rc.embedding is not null
  order by rc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ─── match_resume_chunks_with_resume ───────────────────────────────────────
-- Same as above but scoped to a single resume_id.
create or replace function match_resume_chunks_with_resume(
  query_embedding  vector(384),
  match_user_id    uuid,
  match_resume_id  uuid,
  match_count      int default 5
)
returns table (
  id           uuid,
  resume_id    uuid,
  section_name text,
  chunk_text   text,
  similarity   float
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('ivfflat.probes', '10', true);

  return query
  select
    rc.id,
    rc.resume_id,
    rc.section_name,
    rc.chunk_text,
    (1 - (rc.embedding <=> query_embedding))::float as similarity
  from resume_chunks rc
  where rc.user_id   = match_user_id
    and rc.resume_id  = match_resume_id
    and rc.embedding is not null
  order by rc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Grant execute to service_role and authenticated.
grant execute on function match_resume_chunks(vector, uuid, int)
  to authenticated, service_role;

grant execute on function match_resume_chunks_with_resume(vector, uuid, uuid, int)
  to authenticated, service_role;
