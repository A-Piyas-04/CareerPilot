-- CareerPilot Database Migration
-- Generated from db-design-initial.md
-- Creates all tables, enums, indexes, and RLS policies

-- ============================================
-- Extensions
-- ============================================
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ============================================
-- Enums
-- ============================================
create type resume_status as enum (
  'uploaded',
  'processing',
  'processed',
  'failed'
);

create type application_status as enum (
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected'
);

create type task_status as enum (
  'todo',
  'in_progress',
  'done',
  'cancelled'
);

create type goal_status as enum (
  'active',
  'completed',
  'paused',
  'cancelled'
);

create type message_role as enum (
  'user',
  'assistant',
  'system'
);

create type event_type as enum (
  'deadline',
  'interview',
  'reminder',
  'study',
  'application',
  'custom'
);

-- ============================================
-- SHARED/CORE Module: profiles
-- ============================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  avatar_url text,
  target_role text,
  location text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- SHARED/CORE Module: evaluation_tests
-- ============================================
create table evaluation_tests (
  id uuid primary key default gen_random_uuid(),
  feature_name text not null,
  input_data jsonb not null,
  expected_output text,
  actual_output text,
  passed boolean,
  notes text,
  created_at timestamptz default now()
);

-- ============================================
-- MEMBER 1 Module: CV Intelligence
-- ============================================

-- resumes table
create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_url text,
  raw_text text,
  parsed_summary jsonb,
  status resume_status default 'uploaded',
  is_active boolean default true,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- resume_sections table
create table resume_sections (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references resumes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  section_name text not null,
  section_order int default 0,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- resume_chunks table (RAG table with vector embeddings)
create table resume_chunks (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references resumes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  section_id uuid references resume_sections(id) on delete set null,
  section_name text,
  chunk_index int not null,
  chunk_text text not null,
  token_count int,
  embedding vector(384),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- user_skills table
create table user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  resume_id uuid references resumes(id) on delete set null,
  skill_name text not null,
  category text,
  proficiency text,
  evidence text,
  source text default 'resume',
  created_at timestamptz default now(),
  unique(user_id, skill_name)
);

-- ============================================
-- MEMBER 2 Module: Job Intelligence
-- ============================================

-- job_searches table
create table job_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  query text not null,
  location text,
  filters jsonb default '{}'::jsonb,
  source text,
  created_at timestamptz default now()
);

-- jobs table
create table jobs (
  id uuid primary key default gen_random_uuid(),
  search_id uuid references job_searches(id) on delete set null,
  title text not null,
  company text,
  location text,
  salary_range text,
  job_type text,
  deadline date,
  description text,
  requirements text,
  source text,
  source_url text,
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- job_matches table
create table job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  resume_id uuid references resumes(id) on delete set null,
  job_id uuid not null references jobs(id) on delete cascade,
  fit_score numeric(5,2) not null,
  matched_skills text[],
  missing_skills text[],
  explanation text,
  evidence_chunks uuid[],
  created_at timestamptz default now(),
  unique(user_id, job_id, resume_id)
);

-- ============================================
-- MEMBER 3 Module: Career Assistant & Tracker
-- ============================================

-- applications table (Kanban)
create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  job_match_id uuid references job_matches(id) on delete set null,
  status application_status default 'saved',
  notes text,
  applied_at timestamptz,
  deadline date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- application_history table
create table application_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  old_status application_status,
  new_status application_status not null,
  note text,
  changed_at timestamptz default now()
);

-- assistant_conversations table
create table assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text,
  context jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- assistant_messages table
create table assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references assistant_conversations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role message_role not null,
  content text not null,
  used_resume_chunks uuid[],
  used_job_id uuid references jobs(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- cover_letters table
create table cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  resume_id uuid references resumes(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  title text,
  content text not null,
  version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- roadmaps table
create table roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  target_role text not null,
  duration_weeks int,
  overview text,
  progress_percent numeric(5,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- roadmap_items table
create table roadmap_items (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references roadmaps(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  week_number int,
  title text not null,
  description text,
  resources jsonb default '[]'::jsonb,
  status task_status default 'todo',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- goals table
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  status goal_status default 'active',
  target_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- tasks table
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  goal_id uuid references goals(id) on delete set null,
  roadmap_item_id uuid references roadmap_items(id) on delete set null,
  application_id uuid references applications(id) on delete set null,
  title text not null,
  description text,
  status task_status default 'todo',
  priority int default 1,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- calendar_events table
create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  application_id uuid references applications(id) on delete set null,
  title text not null,
  description text,
  event_type event_type not null,
  start_time timestamptz not null,
  end_time timestamptz,
  reminder_time timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- skill_gap_analysis table
create table skill_gap_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  resume_id uuid references resumes(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  target_role text,
  current_skills text[],
  required_skills text[],
  missing_skills text[],
  recommendations jsonb,
  created_at timestamptz default now()
);

-- ============================================
-- Indexes
-- ============================================

-- profiles indexes
create index idx_profiles_email on profiles(email);
create index idx_profiles_target_role on profiles(target_role);

-- resumes indexes
create index idx_resumes_user_id on resumes(user_id);
create index idx_resumes_status on resumes(status);
create index idx_resumes_is_active on resumes(is_active);

-- resume_sections indexes
create index idx_resume_sections_resume_id on resume_sections(resume_id);
create index idx_resume_sections_user_id on resume_sections(user_id);
create index idx_resume_sections_section_name on resume_sections(section_name);

-- resume_chunks indexes
create index idx_resume_chunks_resume_id on resume_chunks(resume_id);
create index idx_resume_chunks_user_id on resume_chunks(user_id);
create index idx_resume_chunks_section_id on resume_chunks(section_id);
create index idx_resume_chunks_embedding on resume_chunks using ivfflat (embedding vector_cosine_ops);

-- user_skills indexes
create index idx_user_skills_user_id on user_skills(user_id);
create index idx_user_skills_resume_id on user_skills(resume_id);
create index idx_user_skills_category on user_skills(category);
create index idx_user_skills_skill_name on user_skills(skill_name);

-- job_searches indexes
create index idx_job_searches_user_id on job_searches(user_id);
create index idx_job_searches_created_at on job_searches(created_at);

-- jobs indexes
create index idx_jobs_search_id on jobs(search_id);
create index idx_jobs_title on jobs(title);
create index idx_jobs_company on jobs(company);
create index idx_jobs_location on jobs(location);

-- job_matches indexes
create index idx_job_matches_user_id on job_matches(user_id);
create index idx_job_matches_job_id on job_matches(job_id);
create index idx_job_matches_resume_id on job_matches(resume_id);
create index idx_job_matches_fit_score on job_matches(fit_score);

-- applications indexes
create index idx_applications_user_id on applications(user_id);
create index idx_applications_job_id on applications(job_id);
create index idx_applications_status on applications(status);

-- application_history indexes
create index idx_application_history_application_id on application_history(application_id);
create index idx_application_history_changed_at on application_history(changed_at);

-- assistant_conversations indexes
create index idx_assistant_conversations_user_id on assistant_conversations(user_id);
create index idx_assistant_conversations_updated_at on assistant_conversations(updated_at);

-- assistant_messages indexes
create index idx_assistant_messages_conversation_id on assistant_messages(conversation_id);
create index idx_assistant_messages_user_id on assistant_messages(user_id);
create index idx_assistant_messages_created_at on assistant_messages(created_at);

-- cover_letters indexes
create index idx_cover_letters_user_id on cover_letters(user_id);
create index idx_cover_letters_resume_id on cover_letters(resume_id);
create index idx_cover_letters_job_id on cover_letters(job_id);

-- roadmaps indexes
create index idx_roadmaps_user_id on roadmaps(user_id);
create index idx_roadmaps_target_role on roadmaps(target_role);

-- roadmap_items indexes
create index idx_roadmap_items_roadmap_id on roadmap_items(roadmap_id);
create index idx_roadmap_items_user_id on roadmap_items(user_id);
create index idx_roadmap_items_status on roadmap_items(status);
create index idx_roadmap_items_week_number on roadmap_items(week_number);

-- goals indexes
create index idx_goals_user_id on goals(user_id);
create index idx_goals_status on goals(status);
create index idx_goals_target_date on goals(target_date);

-- tasks indexes
create index idx_tasks_user_id on tasks(user_id);
create index idx_tasks_goal_id on tasks(goal_id);
create index idx_tasks_status on tasks(status);
create index idx_tasks_priority on tasks(priority);
create index idx_tasks_due_date on tasks(due_date);

-- calendar_events indexes
create index idx_calendar_events_user_id on calendar_events(user_id);
create index idx_calendar_events_task_id on calendar_events(task_id);
create index idx_calendar_events_application_id on calendar_events(application_id);
create index idx_calendar_events_event_type on calendar_events(event_type);
create index idx_calendar_events_start_time on calendar_events(start_time);

-- skill_gap_analysis indexes
create index idx_skill_gap_analysis_user_id on skill_gap_analysis(user_id);
create index idx_skill_gap_analysis_target_role on skill_gap_analysis(target_role);
create index idx_skill_gap_analysis_created_at on skill_gap_analysis(created_at);

-- evaluation_tests indexes
create index idx_evaluation_tests_feature_name on evaluation_tests(feature_name);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

alter table profiles enable row level security;
alter table evaluation_tests enable row level security;
alter table resumes enable row level security;
alter table resume_sections enable row level security;
alter table resume_chunks enable row level security;
alter table user_skills enable row level security;
alter table job_searches enable row level security;
alter table jobs enable row level security;
alter table job_matches enable row level security;
alter table applications enable row level security;
alter table application_history enable row level security;
alter table assistant_conversations enable row level security;
alter table assistant_messages enable row level security;
alter table cover_letters enable row level security;
alter table roadmaps enable row level security;
alter table roadmap_items enable row level security;
alter table goals enable row level security;
alter table tasks enable row level security;
alter table calendar_events enable row level security;
alter table skill_gap_analysis enable row level security;

-- profiles policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- evaluation_tests policies (admin only - allow all authenticated users for now)
create policy "Authenticated users can view evaluation tests"
  on evaluation_tests for select
  using (auth.role() = 'authenticated');

create policy "Service role can manage evaluation tests"
  on evaluation_tests for all
  using (auth.role() = 'service_role');

-- resumes policies
create policy "Users can view their own resumes"
  on resumes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own resumes"
  on resumes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own resumes"
  on resumes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own resumes"
  on resumes for delete
  using (auth.uid() = user_id);

-- resume_sections policies
create policy "Users can view their own resume sections"
  on resume_sections for select
  using (auth.uid() = user_id);

create policy "Users can insert resume sections"
  on resume_sections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own resume sections"
  on resume_sections for update
  using (auth.uid() = user_id);

create policy "Users can delete their own resume sections"
  on resume_sections for delete
  using (auth.uid() = user_id);

-- resume_chunks policies
create policy "Users can view their own resume chunks"
  on resume_chunks for select
  using (auth.uid() = user_id);

create policy "Users can insert resume chunks"
  on resume_chunks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own resume chunks"
  on resume_chunks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own resume chunks"
  on resume_chunks for delete
  using (auth.uid() = user_id);

-- user_skills policies
create policy "Users can view their own skills"
  on user_skills for select
  using (auth.uid() = user_id);

create policy "Users can insert their own skills"
  on user_skills for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own skills"
  on user_skills for update
  using (auth.uid() = user_id);

create policy "Users can delete their own skills"
  on user_skills for delete
  using (auth.uid() = user_id);

-- job_searches policies
create policy "Users can view their own job searches"
  on job_searches for select
  using (auth.uid() = user_id);

create policy "Users can insert their own job searches"
  on job_searches for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own job searches"
  on job_searches for delete
  using (auth.uid() = user_id);

-- jobs policies (viewable by all authenticated, managed by service)
create policy "Authenticated users can view jobs"
  on jobs for select
  using (auth.role() = 'authenticated');

create policy "Service role can manage jobs"
  on jobs for all
  using (auth.role() = 'service_role');

-- job_matches policies
create policy "Users can view their own job matches"
  on job_matches for select
  using (auth.uid() = user_id);

create policy "Users can insert their own job matches"
  on job_matches for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own job matches"
  on job_matches for update
  using (auth.uid() = user_id);

create policy "Users can delete their own job matches"
  on job_matches for delete
  using (auth.uid() = user_id);

-- applications policies
create policy "Users can view their own applications"
  on applications for select
  using (auth.uid() = user_id);

create policy "Users can insert their own applications"
  on applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own applications"
  on applications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own applications"
  on applications for delete
  using (auth.uid() = user_id);

-- application_history policies
create policy "Users can view their own application history"
  on application_history for select
  using (
    exists (
      select 1 from applications
      where applications.id = application_history.application_id
      and applications.user_id = auth.uid()
    )
  );

create policy "Users can insert their own application history"
  on application_history for insert
  with check (
    exists (
      select 1 from applications
      where applications.id = application_history.application_id
      and applications.user_id = auth.uid()
    )
  );

-- assistant_conversations policies
create policy "Users can view their own conversations"
  on assistant_conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own conversations"
  on assistant_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
  on assistant_conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own conversations"
  on assistant_conversations for delete
  using (auth.uid() = user_id);

-- assistant_messages policies
create policy "Users can view their own messages"
  on assistant_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own messages"
  on assistant_messages for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own messages"
  on assistant_messages for delete
  using (auth.uid() = user_id);

-- cover_letters policies
create policy "Users can view their own cover letters"
  on cover_letters for select
  using (auth.uid() = user_id);

create policy "Users can insert their own cover letters"
  on cover_letters for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own cover letters"
  on cover_letters for update
  using (auth.uid() = user_id);

create policy "Users can delete their own cover letters"
  on cover_letters for delete
  using (auth.uid() = user_id);

-- roadmaps policies
create policy "Users can view their own roadmaps"
  on roadmaps for select
  using (auth.uid() = user_id);

create policy "Users can insert their own roadmaps"
  on roadmaps for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own roadmaps"
  on roadmaps for update
  using (auth.uid() = user_id);

create policy "Users can delete their own roadmaps"
  on roadmaps for delete
  using (auth.uid() = user_id);

-- roadmap_items policies
create policy "Users can view their own roadmap items"
  on roadmap_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own roadmap items"
  on roadmap_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own roadmap items"
  on roadmap_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own roadmap items"
  on roadmap_items for delete
  using (auth.uid() = user_id);

-- goals policies
create policy "Users can view their own goals"
  on goals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own goals"
  on goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own goals"
  on goals for update
  using (auth.uid() = user_id);

create policy "Users can delete their own goals"
  on goals for delete
  using (auth.uid() = user_id);

-- tasks policies
create policy "Users can view their own tasks"
  on tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on tasks for delete
  using (auth.uid() = user_id);

-- calendar_events policies
create policy "Users can view their own calendar events"
  on calendar_events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own calendar events"
  on calendar_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own calendar events"
  on calendar_events for update
  using (auth.uid() = user_id);

create policy "Users can delete their own calendar events"
  on calendar_events for delete
  using (auth.uid() = user_id);

-- skill_gap_analysis policies
create policy "Users can view their own skill gap analyses"
  on skill_gap_analysis for select
  using (auth.uid() = user_id);

create policy "Users can insert their own skill gap analyses"
  on skill_gap_analysis for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own skill gap analyses"
  on skill_gap_analysis for update
  using (auth.uid() = user_id);

create policy "Users can delete their own skill gap analyses"
  on skill_gap_analysis for delete
  using (auth.uid() = user_id);

-- ============================================
-- Database Functions
-- ============================================

-- Function to auto-update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for profiles updated_at
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- Trigger for resumes updated_at
create trigger update_resumes_updated_at
  before update on resumes
  for each row
  execute function update_updated_at_column();

-- Trigger for applications updated_at
create trigger update_applications_updated_at
  before update on applications
  for each row
  execute function update_updated_at_column();

-- Trigger for assistant_conversations updated_at
create trigger update_assistant_conversations_updated_at
  before update on assistant_conversations
  for each row
  execute function update_updated_at_column();

-- Trigger for cover_letters updated_at
create trigger update_cover_letters_updated_at
  before update on cover_letters
  for each row
  execute function update_updated_at_column();

-- Trigger for roadmaps updated_at
create trigger update_roadmaps_updated_at
  before update on roadmaps
  for each row
  execute function update_updated_at_column();

-- Trigger for goals updated_at
create trigger update_goals_updated_at
  before update on goals
  for each row
  execute function update_updated_at_column();

-- Trigger for tasks updated_at
create trigger update_tasks_updated_at
  before update on tasks
  for each row
  execute function update_updated_at_column();

-- Trigger for calendar_events updated_at
create trigger update_calendar_events_updated_at
  before update on calendar_events
  for each row
  execute function update_updated_at_column();

-- Function to automatically create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, created_at, updated_at)
  values (new.id, new.email, now(), now());
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call handle_new_user on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();