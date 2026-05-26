-- CV Intelligence: grant PostgREST roles access to resume tables.
-- Without these grants, the backend service_role client gets:
--   permission denied for table resumes (SQLSTATE 42501)

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on public.resumes to authenticated, service_role;
grant select, insert, update, delete on public.resume_sections to authenticated, service_role;
grant select, insert, update, delete on public.resume_chunks to authenticated, service_role;
grant select, insert, update, delete on public.user_skills to authenticated, service_role;
