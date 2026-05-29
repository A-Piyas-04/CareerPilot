-- Feature 3.2: Cover Letter Generator compatibility fields and grants.

alter table public.cover_letters
  add column if not exists job_title text,
  add column if not exists company_name text,
  add column if not exists job_description text,
  add column if not exists tone text,
  add column if not exists extra_notes text;

create index if not exists idx_cover_letters_user_updated_at
  on public.cover_letters(user_id, updated_at desc);

create index if not exists idx_cover_letters_job_id
  on public.cover_letters(job_id);

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.cover_letters to authenticated, service_role;
