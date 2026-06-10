-- Per-customer handoff pause: stop bot replies until merchant marks follow-up done.

create table if not exists public.conversation_modes (
  id uuid primary key default gen_random_uuid(),
  merchant_scoped_id text not null,
  instagram_customer_id text not null,
  mode text not null default 'auto' check (mode in ('auto', 'manual')),
  manual_until timestamptz,
  updated_at timestamptz not null default now(),
  unique (merchant_scoped_id, instagram_customer_id)
);

create index if not exists conversation_modes_customer_idx
  on public.conversation_modes (merchant_scoped_id, instagram_customer_id);

alter table public.conversation_modes enable row level security;
