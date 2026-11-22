-- RadiantWaves Football portal: additional admin read policies.
-- Run only after assigning app_metadata.role = 'admin' to the approved administrator account.
-- Existing player-owned policies should remain enabled. Do not disable RLS.

create policy "admins can view all player profiles"
on public.player_profiles
for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admins can view all player media"
on public.player_media
for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Player media ownership uses the exact column name supplied for this table: userid.
-- Existing player insert/select/update/delete policies must also enforce auth.uid() = userid.
