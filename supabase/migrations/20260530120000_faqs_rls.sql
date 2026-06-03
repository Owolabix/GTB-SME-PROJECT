-- Merchant FAQs (Lynk dashboard CRUD; CX-Assistant reads via service role)

drop policy if exists "faqs_select_own" on public.faqs;
drop policy if exists "faqs_insert_own" on public.faqs;
drop policy if exists "faqs_update_own" on public.faqs;
drop policy if exists "faqs_delete_own" on public.faqs;

create policy "faqs_select_own" on public.faqs
  for select
  using (merchant_scoped_id = auth.uid()::text);

create policy "faqs_insert_own" on public.faqs
  for insert
  with check (merchant_scoped_id = auth.uid()::text);

create policy "faqs_update_own" on public.faqs
  for update
  using (merchant_scoped_id = auth.uid()::text)
  with check (merchant_scoped_id = auth.uid()::text);

create policy "faqs_delete_own" on public.faqs
  for delete
  using (merchant_scoped_id = auth.uid()::text);
