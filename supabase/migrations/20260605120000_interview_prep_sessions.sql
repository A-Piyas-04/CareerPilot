create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  setup jsonb not null default '{}'::jsonb,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned')),
  current_index integer not null default 0,
  question_count integer not null default 5,
  average_score numeric not null default 0,
  seconds_left integer,
  last_question_started_at timestamptz,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interview_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_index integer not null,
  question jsonb not null,
  answer text,
  evaluation jsonb,
  skipped boolean not null default false,
  elapsed_seconds integer not null default 0,
  score integer not null default 0,
  status text not null default 'answering'
    check (status in ('answering', 'completed', 'skipped')),
  seconds_left integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, question_index)
);

create index if not exists idx_interview_sessions_user_status_updated
  on public.interview_sessions(user_id, status, updated_at desc);

create index if not exists idx_interview_attempts_session_index
  on public.interview_attempts(session_id, question_index);

drop trigger if exists update_interview_sessions_updated_at on public.interview_sessions;
create trigger update_interview_sessions_updated_at
  before update on public.interview_sessions
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_interview_attempts_updated_at on public.interview_attempts;
create trigger update_interview_attempts_updated_at
  before update on public.interview_attempts
  for each row execute function public.update_updated_at_column();

alter table public.interview_sessions enable row level security;
alter table public.interview_attempts enable row level security;

drop policy if exists "interview_sessions_select_own" on public.interview_sessions;
create policy "interview_sessions_select_own"
  on public.interview_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "interview_sessions_insert_own" on public.interview_sessions;
create policy "interview_sessions_insert_own"
  on public.interview_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "interview_sessions_update_own" on public.interview_sessions;
create policy "interview_sessions_update_own"
  on public.interview_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "interview_sessions_delete_own" on public.interview_sessions;
create policy "interview_sessions_delete_own"
  on public.interview_sessions for delete
  using (auth.uid() = user_id);

drop policy if exists "interview_attempts_select_own" on public.interview_attempts;
create policy "interview_attempts_select_own"
  on public.interview_attempts for select
  using (auth.uid() = user_id);

drop policy if exists "interview_attempts_insert_own" on public.interview_attempts;
create policy "interview_attempts_insert_own"
  on public.interview_attempts for insert
  with check (auth.uid() = user_id);

drop policy if exists "interview_attempts_update_own" on public.interview_attempts;
create policy "interview_attempts_update_own"
  on public.interview_attempts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "interview_attempts_delete_own" on public.interview_attempts;
create policy "interview_attempts_delete_own"
  on public.interview_attempts for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.interview_sessions to authenticated, service_role;
grant select, insert, update, delete on public.interview_attempts to authenticated, service_role;
