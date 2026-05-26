-- pgvector RPC functions for resume chunk similarity search.
-- Replaces the numpy cosine fallback in retrieval_service.py so the IVFFlat
-- index on resume_chunks.embedding (vector_cosine_ops) is actually used.
--
-- Parameter names MUST match the keys passed by
-- backend/app/cv_intelligence/services/retrieval_service.py, because
-- Supabase RPC sends arguments by name.

create or replace function public.match_resume_chunks(
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
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    rc.id,
    rc.resume_id,
    rc.section_name,
    rc.chunk_text,
    (1 - (rc.embedding <=> query_embedding))::float as similarity
  from public.resume_chunks rc
  where rc.user_id = match_user_id
    and rc.embedding is not null
  order by rc.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function public.match_resume_chunks_with_resume(
  query_embedding vector(384),
  match_user_id uuid,
  match_resume_id uuid,
  match_count int
)
returns table (
  id uuid,
  resume_id uuid,
  section_name text,
  chunk_text text,
  similarity float
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    rc.id,
    rc.resume_id,
    rc.section_name,
    rc.chunk_text,
    (1 - (rc.embedding <=> query_embedding))::float as similarity
  from public.resume_chunks rc
  where rc.user_id = match_user_id
    and rc.resume_id = match_resume_id
    and rc.embedding is not null
  order by rc.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.match_resume_chunks(vector(384), uuid, int)
  to authenticated, service_role;

grant execute on function public.match_resume_chunks_with_resume(vector(384), uuid, uuid, int)
  to authenticated, service_role;
