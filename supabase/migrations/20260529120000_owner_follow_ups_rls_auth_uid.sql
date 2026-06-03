-- Lynk store_info uses auth.uid() as merchant_scoped_id; CX-Assistant may use ig_user_id,
-- auth user id, or legacy "default". Allow dashboard read/update for all of these.

drop policy if exists "owner_follow_ups_select_own" on public.owner_follow_ups;
drop policy if exists "owner_follow_ups_update_own" on public.owner_follow_ups;

create policy "owner_follow_ups_select_own" on public.owner_follow_ups
  for select
  using (
    merchant_scoped_id = auth.uid()::text
    or merchant_scoped_id in (
      select ig_user_id from public.instagram_accounts where user_id = auth.uid()
    )
    or merchant_scoped_id in (
      select id::text from public.instagram_accounts where user_id = auth.uid()
    )
    or (
      merchant_scoped_id = 'default'
      and exists (
        select 1 from public.instagram_accounts where user_id = auth.uid()
      )
    )
  );

create policy "owner_follow_ups_update_own" on public.owner_follow_ups
  for update
  using (
    merchant_scoped_id = auth.uid()::text
    or merchant_scoped_id in (
      select ig_user_id from public.instagram_accounts where user_id = auth.uid()
    )
    or merchant_scoped_id in (
      select id::text from public.instagram_accounts where user_id = auth.uid()
    )
    or (
      merchant_scoped_id = 'default'
      and exists (
        select 1 from public.instagram_accounts where user_id = auth.uid()
      )
    )
  )
  with check (
    merchant_scoped_id = auth.uid()::text
    or merchant_scoped_id in (
      select ig_user_id from public.instagram_accounts where user_id = auth.uid()
    )
    or merchant_scoped_id in (
      select id::text from public.instagram_accounts where user_id = auth.uid()
    )
    or (
      merchant_scoped_id = 'default'
      and exists (
        select 1 from public.instagram_accounts where user_id = auth.uid()
      )
    )
  );
