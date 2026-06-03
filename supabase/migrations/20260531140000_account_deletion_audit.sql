-- Minimal erasure audit trail (timestamp only — no PII). Service role inserts on successful account deletion.
create table if not exists public.account_deletion_audit (
  id uuid primary key default gen_random_uuid(),
  deleted_at timestamptz not null default now()
);

create index if not exists account_deletion_audit_deleted_at_idx
  on public.account_deletion_audit (deleted_at desc);

alter table public.account_deletion_audit enable row level security;

comment on table public.account_deletion_audit is
  'Proof-of-erasure log: one row per successful Lynk account deletion. No user identifiers stored.';
