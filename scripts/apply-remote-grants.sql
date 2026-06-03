-- Run once in Supabase Dashboard → SQL Editor:
-- https://supabase.com/dashboard/project/hiqdwrjoqfpelrhujtoj/sql/new
--
-- Fixes "permission denied for table cover_letters" (and related PostgREST 42501 errors).
-- Safe to re-run (GRANT is idempotent).

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on public.cover_letters to authenticated, service_role;
grant select, insert, update, delete on public.skill_gap_analysis to authenticated, service_role;
grant select, insert, update, delete on public.roadmaps to authenticated, service_role;
grant select, insert, update, delete on public.roadmap_items to authenticated, service_role;
grant select, insert, update, delete on public.goals to authenticated, service_role;
grant select, insert, update, delete on public.tasks to authenticated, service_role;
grant select, insert, update, delete on public.calendar_events to authenticated, service_role;
grant select, insert, update, delete on public.resumes to authenticated, service_role;
grant select, insert, update, delete on public.resume_sections to authenticated, service_role;
grant select, insert, update, delete on public.resume_chunks to authenticated, service_role;
grant select, insert, update, delete on public.user_skills to authenticated, service_role;
grant select, insert, update, delete on public.assistant_conversations to authenticated, service_role;
grant select, insert, delete on public.assistant_messages to authenticated, service_role;
grant select, insert, update, delete on public.job_searches to authenticated, service_role;
grant select, insert, update, delete on public.jobs to authenticated, service_role;
grant select, insert, update, delete on public.job_matches to authenticated, service_role;
