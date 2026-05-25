-- Feature 1.2: keep goal task priorities aligned with the implementation guide.

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.goals to authenticated, service_role;
grant select, insert, update, delete on public.tasks to authenticated, service_role;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_priority_range'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_priority_range
      check (priority between 1 and 3)
      not valid;
  end if;
end $$;
