-- Per-project code workspace for in-browser IDE (file tree + editor).

create table public.project_code_files (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects on delete cascade not null,
  path text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, path)
);

create index project_code_files_project_id_idx
  on public.project_code_files (project_id);

alter table public.project_code_files enable row level security;

create policy "Users manage code files for own projects"
  on public.project_code_files for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_code_files.project_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_code_files.project_id
        and p.user_id = auth.uid()
    )
  );
