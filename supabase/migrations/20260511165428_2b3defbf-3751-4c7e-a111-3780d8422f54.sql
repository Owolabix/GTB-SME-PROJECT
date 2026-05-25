
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- instagram_accounts
create table public.instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ig_user_id text not null,
  username text not null,
  access_token text not null,
  token_expires_at timestamptz,
  connected_at timestamptz not null default now(),
  unique (user_id, ig_user_id)
);
alter table public.instagram_accounts enable row level security;
create policy "ig_select_own" on public.instagram_accounts for select using (auth.uid() = user_id);
create policy "ig_insert_own" on public.instagram_accounts for insert with check (auth.uid() = user_id);
create policy "ig_update_own" on public.instagram_accounts for update using (auth.uid() = user_id);
create policy "ig_delete_own" on public.instagram_accounts for delete using (auth.uid() = user_id);

-- automations
create type public.automation_status as enum ('draft','active','paused');
create type public.automation_trigger as enum ('comment','dm');
create type public.automation_post_scope as enum ('all','specific');

create table public.automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled automation',
  status public.automation_status not null default 'draft',
  trigger_type public.automation_trigger not null default 'comment',
  keywords text[] not null default '{}',
  post_scope public.automation_post_scope not null default 'all',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.automations enable row level security;
create policy "auto_select_own" on public.automations for select using (auth.uid() = user_id);
create policy "auto_insert_own" on public.automations for insert with check (auth.uid() = user_id);
create policy "auto_update_own" on public.automations for update using (auth.uid() = user_id);
create policy "auto_delete_own" on public.automations for delete using (auth.uid() = user_id);
create trigger automations_updated_at before update on public.automations
for each row execute function public.set_updated_at();

-- automation_posts
create table public.automation_posts (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,
  ig_post_id text not null,
  unique (automation_id, ig_post_id)
);
alter table public.automation_posts enable row level security;
create policy "ap_select_own" on public.automation_posts for select using (
  exists (select 1 from public.automations a where a.id = automation_id and a.user_id = auth.uid())
);
create policy "ap_write_own" on public.automation_posts for all using (
  exists (select 1 from public.automations a where a.id = automation_id and a.user_id = auth.uid())
) with check (
  exists (select 1 from public.automations a where a.id = automation_id and a.user_id = auth.uid())
);

-- automation_messages
create table public.automation_messages (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,
  position int not null default 0,
  body text not null,
  delay_seconds int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.automation_messages enable row level security;
create policy "am_select_own" on public.automation_messages for select using (
  exists (select 1 from public.automations a where a.id = automation_id and a.user_id = auth.uid())
);
create policy "am_write_own" on public.automation_messages for all using (
  exists (select 1 from public.automations a where a.id = automation_id and a.user_id = auth.uid())
) with check (
  exists (select 1 from public.automations a where a.id = automation_id and a.user_id = auth.uid())
);

-- dm_events
create type public.dm_event_status as enum ('sent','failed','skipped');
create table public.dm_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  automation_id uuid references public.automations(id) on delete set null,
  ig_event_id text unique,
  trigger_payload jsonb,
  status public.dm_event_status not null default 'sent',
  error text,
  created_at timestamptz not null default now()
);
alter table public.dm_events enable row level security;
create policy "dme_select_own" on public.dm_events for select using (auth.uid() = user_id);
-- inserts go through service role (webhook); no insert policy for clients
