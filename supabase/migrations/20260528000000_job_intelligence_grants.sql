-- Job Intelligence: grant PostgREST roles access to job tables.
-- Without these grants, the backend service_role client gets:
--   permission denied for table job_matches (SQLSTATE 42501)

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on public.job_searches to authenticated, service_role;
grant select, insert, update, delete on public.jobs to authenticated, service_role;
grant select, insert, update, delete on public.job_matches to authenticated, service_role;
