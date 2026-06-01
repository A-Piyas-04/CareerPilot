-- Skill gap & roadmap tables: grant PostgREST roles access.
-- Without these grants, the backend service_role client gets:
--   permission denied for table skill_gap_analysis (SQLSTATE 42501)

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on public.skill_gap_analysis to authenticated, service_role;
grant select, insert, update, delete on public.roadmaps to authenticated, service_role;
grant select, insert, update, delete on public.roadmap_items to authenticated, service_role;

-- Re-assert CV table grants if an earlier migration was not applied.
grant select, insert, update, delete on public.resumes to authenticated, service_role;
grant select, insert, update, delete on public.resume_sections to authenticated, service_role;
grant select, insert, update, delete on public.resume_chunks to authenticated, service_role;
grant select, insert, update, delete on public.user_skills to authenticated, service_role;
