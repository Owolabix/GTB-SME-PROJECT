-- Track Meta message_ids for bot/automation outbound DMs so merchant echoes can be
-- distinguished from owner manual replies (cross-process: Lynk + CX-Assistant).

create table public.bot_outbound_mids (
  message_id text primary key,
  merchant_scoped_id text not null,
  instagram_customer_id text not null,
  created_at timestamptz not null default now()
);

create index bot_outbound_mids_created_at_idx
  on public.bot_outbound_mids (created_at);

alter table public.bot_outbound_mids enable row level security;
