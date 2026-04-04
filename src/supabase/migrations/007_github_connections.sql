-- ============================================================
-- GitHub Connections
-- Stores the OAuth provider_token so we can push repos
-- on behalf of the user.
-- ============================================================

create table public.github_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  github_username text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.github_connections enable row level security;

create policy "Users can view own github connection"
  on public.github_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert own github connection"
  on public.github_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own github connection"
  on public.github_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete own github connection"
  on public.github_connections for delete
  using (auth.uid() = user_id);
