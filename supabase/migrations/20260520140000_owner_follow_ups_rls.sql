-- Let Lynk dashboard (authenticated SME) read and resolve their own escalations.
-- merchant_scoped_id matches instagram_accounts.ig_user_id for auth.uid().

create policy "owner_follow_ups_select_own" on public.owner_follow_ups
  for select
  using (
    merchant_scoped_id in (
      select ig_user_id from public.instagram_accounts where user_id = auth.uid()
    )
  );

create policy "owner_follow_ups_update_own" on public.owner_follow_ups
  for update
  using (
    merchant_scoped_id in (
      select ig_user_id from public.instagram_accounts where user_id = auth.uid()
    )
  )
  with check (
    merchant_scoped_id in (
      select ig_user_id from public.instagram_accounts where user_id = auth.uid()
    )
  );
