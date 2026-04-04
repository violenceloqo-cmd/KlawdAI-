-- Per-browser session log for Account → Active sessions (Claude-style).

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_key text not null,
  device_label text not null default 'Unknown device',
  location_label text not null default 'Unknown',
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, client_key)
);

create index if not exists user_sessions_user_last_seen_idx
  on public.user_sessions (user_id, last_seen_at desc);

alter table public.user_sessions enable row level security;

create policy "Users read own sessions"
  on public.user_sessions for select
  using (auth.uid() = user_id);

create policy "Users insert own sessions"
  on public.user_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users update own sessions"
  on public.user_sessions for update
  using (auth.uid() = user_id);

create policy "Users delete own sessions"
  on public.user_sessions for delete
  using (auth.uid() = user_id);
