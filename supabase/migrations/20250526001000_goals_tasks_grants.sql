-- Feature 1.2: grant API roles access to goals and tasks.
-- The application backend uses Supabase/PostgREST roles, so RLS policies alone
-- are not enough unless the table privileges are also granted.

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.goals to authenticated, service_role;
grant select, insert, update, delete on public.tasks to authenticated, service_role;
