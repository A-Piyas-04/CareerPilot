-- Feature 1.4: grant API roles access needed by the calendar module.

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.calendar_events to authenticated, service_role;
grant select on public.jobs to authenticated, service_role;
