-- Roadmap schema compatibility for Phase 3.1.

alter table public.roadmaps
  add column if not exists resume_id uuid references public.resumes(id) on delete set null;

create index if not exists idx_roadmaps_resume_id
  on public.roadmaps(resume_id);

alter table public.roadmap_items
  add column if not exists updated_at timestamptz default now();

drop trigger if exists update_roadmap_items_updated_at on public.roadmap_items;

create trigger update_roadmap_items_updated_at
  before update on public.roadmap_items
  for each row
  execute function public.update_updated_at_column();
