-- Let Lynk Home subscribe to live updates (Supabase Realtime).
-- Safe to re-run: ignore if tables are already in the publication.

do $$
begin
  alter publication supabase_realtime add table public.dm_events;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.owner_follow_ups;
exception
  when duplicate_object then null;
end $$;
