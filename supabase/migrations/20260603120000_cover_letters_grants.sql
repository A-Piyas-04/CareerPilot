-- Ensure PostgREST roles can access cover_letters (idempotent with 20260529000000).

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.cover_letters to authenticated, service_role;
