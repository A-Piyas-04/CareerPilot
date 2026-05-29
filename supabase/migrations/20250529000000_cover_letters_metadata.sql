-- Add metadata jsonb to cover_letters for RAG provenance (used_resume_chunks, etc.)
alter table cover_letters
  add column if not exists metadata jsonb default '{}'::jsonb;
