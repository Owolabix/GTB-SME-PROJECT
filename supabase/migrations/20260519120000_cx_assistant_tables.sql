-- CX-Assistant (Topic 2) tables — AI sessions, catalogue fallback, owner follow-ups.
-- Safe to run on the same Supabase project as Lynk Assistant (frontend).

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null,
  description text,
  stock integer default 0,
  category text,
  merchant_scoped_id text,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  instagram_user_id text not null,
  merchant_scoped_id text default 'default',
  items jsonb not null,
  status text default 'pending',
  total numeric(10, 2),
  created_at timestamptz default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  merchant_scoped_id text not null default 'default',
  instagram_user_id text not null,
  messages jsonb default '[]',
  updated_at timestamptz default now(),
  constraint sessions_merchant_customer_unique unique (merchant_scoped_id, instagram_user_id)
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  merchant_scoped_id text
);

create table if not exists public.store_config (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  value text not null,
  merchant_scoped_id text,
  constraint store_config_merchant_key_unique unique (merchant_scoped_id, key)
);

create table if not exists public.owner_follow_ups (
  id uuid primary key default gen_random_uuid(),
  merchant_scoped_id text not null,
  instagram_customer_id text not null,
  summary text not null,
  status text not null default 'open',
  created_at timestamptz default now()
);

create index if not exists owner_follow_ups_merchant_status_idx
  on public.owner_follow_ups (merchant_scoped_id, status);

-- Service role (CX-Assistant server) bypasses RLS; lock down for anon/authenticated clients.
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.sessions enable row level security;
alter table public.faqs enable row level security;
alter table public.store_config enable row level security;
alter table public.owner_follow_ups enable row level security;
