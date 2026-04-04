-- ============================================================
-- Clode Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null default '',
  avatar_url text,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  chat_font text not null default 'default' check (chat_font in ('default', 'system', 'dyslexic')),
  allow_model_improvement boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on user signup (username + password auth stores synthetic email)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'username',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- PROJECTS
-- ============================================================
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text not null default '',
  instructions text not null default '',
  starred boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  project_id uuid references public.projects on delete set null,
  title text not null default 'New chat',
  model text not null default 'haiku-4-5',
  starred boolean not null default false,
  shared boolean not null default false,
  share_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_user_id_idx on public.conversations(user_id);
create index conversations_project_id_idx on public.conversations(project_id);
create index conversations_share_id_idx on public.conversations(share_id);
create index conversations_updated_at_idx on public.conversations(updated_at desc);

alter table public.conversations enable row level security;

create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Anyone can view shared conversations"
  on public.conversations for select
  using (shared = true and share_id is not null);

create policy "Users can insert own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- ============================================================
-- MESSAGES
-- ============================================================
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null default '',
  thinking_content text,
  model text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  feedback text check (feedback in ('up', 'down', null)),
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages(conversation_id);
create index messages_created_at_idx on public.messages(created_at);

alter table public.messages enable row level security;

create policy "Users can view own messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Anyone can view messages of shared conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.shared = true
    )
  );

create policy "Users can insert messages to own conversations"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Users can update messages in own conversations"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Users can delete messages in own conversations"
  on public.messages for delete
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- Auto-update conversation.updated_at when a message is inserted
create or replace function public.update_conversation_timestamp()
returns trigger as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_message_created
  after insert on public.messages
  for each row execute function public.update_conversation_timestamp();

-- ============================================================
-- PROJECT DOCUMENTS
-- ============================================================
create table public.project_documents (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects on delete cascade not null,
  name text not null,
  file_path text not null,
  file_size integer not null default 0,
  mime_type text not null default 'text/plain',
  extracted_text text not null default '',
  created_at timestamptz not null default now()
);

alter table public.project_documents enable row level security;

create policy "Users can view own project documents"
  on public.project_documents for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "Users can insert project documents"
  on public.project_documents for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "Users can delete own project documents"
  on public.project_documents for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- ============================================================
-- USAGE LOGS
-- ============================================================
create table public.usage_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  conversation_id uuid references public.conversations on delete set null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(10, 6) not null default 0,
  created_at timestamptz not null default now()
);

create index usage_logs_user_id_idx on public.usage_logs(user_id);
create index usage_logs_created_at_idx on public.usage_logs(created_at);

alter table public.usage_logs enable row level security;

create policy "Users can view own usage logs"
  on public.usage_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage logs"
  on public.usage_logs for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- Storage bucket for project documents
-- ============================================================
insert into storage.buckets (id, name, public)
values ('project-documents', 'project-documents', false)
on conflict (id) do nothing;

create policy "Users can upload project documents"
  on storage.objects for insert
  with check (
    bucket_id = 'project-documents'
    and auth.role() = 'authenticated'
  );

create policy "Users can view own project documents"
  on storage.objects for select
  using (
    bucket_id = 'project-documents'
    and auth.role() = 'authenticated'
  );

create policy "Users can delete own project documents"
  on storage.objects for delete
  using (
    bucket_id = 'project-documents'
    and auth.role() = 'authenticated'
  );
