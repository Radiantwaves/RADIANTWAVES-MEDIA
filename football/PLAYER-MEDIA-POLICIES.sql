-- Run this in Supabase SQL Editor for the RadiantWaves Football Talent project.
-- The existing football/SECURITY-SETUP.sql identifies the ownership column as public.player_media.user_id.
-- This grants authenticated players access only to their own media rows.
-- The separate admin SELECT policy in SECURITY-SETUP.sql remains in place.

alter table public.player_media enable row level security;

grant select, insert, delete on table public.player_media to authenticated;

drop policy if exists "players can view own media" on public.player_media;
create policy "players can view own media"
on public.player_media
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "players can insert own media" on public.player_media;
create policy "players can insert own media"
on public.player_media
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "players can delete own media" on public.player_media;
create policy "players can delete own media"
on public.player_media
for delete
to authenticated
using (auth.uid() = user_id);
