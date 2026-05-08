-- Optional local seed for the Player Hub Supabase draft schema.
-- This file contains no real credentials and should not be used as production data.

insert into public.club_teams (
  legacy_team_id,
  name,
  country,
  city,
  active
) values (
  'seed-club-furuset',
  'Furuset',
  'Norway',
  'Oslo',
  true
) on conflict (legacy_team_id) do update set
  name = excluded.name,
  country = excluded.country,
  city = excluded.city,
  active = excluded.active,
  updated_at = now();

insert into public.tournaments (
  legacy_tournament_id,
  name,
  country,
  city,
  visibility,
  status,
  published
) values (
  'seed-tournament-ltsk-overgame-league',
  'LTSK OVERGAME LEAGUE',
  'Norway',
  'Oslo',
  'private',
  'draft',
  false
) on conflict (legacy_tournament_id) do update set
  name = excluded.name,
  country = excluded.country,
  city = excluded.city,
  visibility = excluded.visibility,
  status = excluded.status,
  published = excluded.published,
  updated_at = now();
