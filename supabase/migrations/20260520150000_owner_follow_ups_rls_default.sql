-- Extend RLS: legacy CX rows often use merchant_scoped_id = 'default' while Lynk stores real ig_user_id.

drop policy if exists "owner_follow_ups_select_own" on public.owner_follow_ups;
drop policy if exists "owner_follow_ups_update_own" on public.owner_follow_ups;

create policy "owner_follow_ups_select_own" on public.owner_follow_ups
  for select
  using (
    merchant_scoped_id in (
      select ig_user_id from public.instagram_accounts where user_id = auth.uid()
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
    merchant_scoped_id in (
      select ig_user_id from public.instagram_accounts where user_id = auth.uid()
    )
    or (
      merchant_scoped_id = 'default'
      and exists (
        select 1 from public.instagram_accounts where user_id = auth.uid()
      )
    )
  )
  with check (
    merchant_scoped_id in (
      select ig_user_id from public.instagram_accounts where user_id = auth.uid()
    )
    or (
      merchant_scoped_id = 'default'
      and exists (
        select 1 from public.instagram_accounts where user_id = auth.uid()
      )
    )
  );
