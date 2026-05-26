-- Feature 1.1: Kanban manual applications and atomic status changes.

alter table public.applications
  add column if not exists manual_job_title text,
  add column if not exists manual_company text,
  add column if not exists manual_location text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'applications_has_job_or_manual_title'
      and conrelid = 'public.applications'::regclass
  ) then
    alter table public.applications
      add constraint applications_has_job_or_manual_title
      check (
        job_id is not null
        or nullif(btrim(manual_job_title), '') is not null
      )
      not valid;

    alter table public.applications
      validate constraint applications_has_job_or_manual_title;
  end if;
end $$;

create or replace function public.change_application_status(
  p_application_id uuid,
  p_user_id uuid,
  p_new_status application_status,
  p_note text default null
)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_application public.applications%rowtype;
  v_old_status application_status;
begin
  select *
    into v_application
    from public.applications
   where id = p_application_id
     and user_id = p_user_id
   for update;

  if not found then
    raise exception 'Application not found'
      using errcode = 'P0002';
  end if;

  v_old_status := v_application.status;

  if v_old_status is distinct from p_new_status then
    update public.applications
       set status = p_new_status,
           applied_at = case
             when p_new_status = 'applied'::application_status and applied_at is null
               then now()
             else applied_at
           end,
           updated_at = now()
     where id = p_application_id
       and user_id = p_user_id
     returning * into v_application;

    insert into public.application_history (
      application_id,
      old_status,
      new_status,
      note
    )
    values (
      p_application_id,
      v_old_status,
      p_new_status,
      p_note
    );
  end if;

  return v_application;
end;
$$;

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.applications to authenticated, service_role;
grant select, insert on public.application_history to authenticated, service_role;
grant execute on function public.change_application_status(
  uuid,
  uuid,
  application_status,
  text
) to authenticated, service_role;
