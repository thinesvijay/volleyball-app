-- Make Teams Pro Player Hub Supabase schema draft.
-- Planning artifact only: this file is not imported by the running React app.
-- RLS is intentionally not enabled here. See docs/supabase-player-hub-migration.md
-- for the proposed policy model before applying production policies.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  legacy_username text not null unique,
  username text not null unique,
  password_hash text,
  role text not null default 'player'
    check (role in ('admin', 'trainer', 'player', 'archived')),
  display_name text,
  email text,
  phone text,
  active boolean not null default true,
  can_use_team_builder boolean not null default false,
  can_use_tournaments boolean not null default false,
  spreadsheet_id text,
  skill_view text,
  skill_scale integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_teams (
  id uuid primary key default gen_random_uuid(),
  legacy_team_id text unique,
  name text not null,
  country text,
  city text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists club_teams_active_name_place_idx
  on public.club_teams (
    lower(btrim(name)),
    lower(btrim(coalesce(country, ''))),
    lower(btrim(coalesce(city, '')))
  )
  where active;

create table if not exists public.player_profiles (
  id uuid primary key default gen_random_uuid(),
  legacy_profile_id text unique,
  user_id uuid references public.app_users(id) on delete set null,
  username text not null,
  first_name text,
  last_name text,
  display_name text not null,
  email text,
  phone text,
  country text,
  region text,
  club_team_id uuid references public.club_teams(id) on delete set null,
  legacy_club_team_id text,
  club_team_name text,
  club_or_team text,
  team_note text,
  profile_type text not null default 'Player',
  free_agent boolean not null default false,
  primary_role text,
  secondary_role text,
  custom_role text,
  level text,
  availability text,
  looking_for_team boolean not null default false,
  available_as_substitute boolean not null default false,
  can_guest_for_teams boolean not null default false,
  interested_abroad boolean not null default false,
  public_visible boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  legacy_request_id text unique,
  user_id uuid references public.app_users(id) on delete set null,
  username text not null,
  display_name text,
  email text,
  request_type text not null check (request_type in ('CAPTAIN', 'TRAINER', 'ORGANIZER')),
  club_team_id uuid references public.club_teams(id) on delete set null,
  legacy_club_team_id text,
  club_team_name text,
  message text,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  admin_note text,
  reviewed_by_user_id uuid references public.app_users(id) on delete set null,
  reviewed_by_username text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists access_requests_pending_once_idx
  on public.access_requests (lower(username), request_type)
  where status = 'PENDING';

create table if not exists public.team_profiles (
  id uuid primary key default gen_random_uuid(),
  legacy_team_profile_id text unique,
  club_team_id uuid references public.club_teams(id) on delete set null,
  legacy_club_team_id text,
  club_team_name text,
  country text,
  captain_user_id uuid references public.app_users(id) on delete set null,
  captain_username text not null,
  captain_display_name text,
  team_level text,
  team_description text,
  contact_note text,
  needs_players boolean not null default false,
  needs_text text,
  active boolean not null default true,
  public_visible boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_identity_change_requests (
  id uuid primary key default gen_random_uuid(),
  legacy_request_id text unique,
  club_team_id uuid references public.club_teams(id) on delete set null,
  legacy_team_id text,
  current_name text,
  requested_name text,
  current_country text,
  requested_country text,
  current_city text,
  requested_city text,
  requested_by_user_id uuid references public.app_users(id) on delete set null,
  requested_by_username text not null,
  reason text,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  admin_note text,
  reviewed_by_user_id uuid references public.app_users(id) on delete set null,
  reviewed_by_username text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  legacy_team_member_id text unique,
  team_profile_id uuid references public.team_profiles(id) on delete cascade,
  legacy_team_profile_id text,
  club_team_id uuid references public.club_teams(id) on delete set null,
  legacy_club_team_id text,
  club_team_name text,
  captain_user_id uuid references public.app_users(id) on delete set null,
  captain_username text,
  player_user_id uuid references public.app_users(id) on delete set null,
  player_username text not null,
  player_display_name text,
  player_email text,
  player_phone text,
  player_country text,
  source_interest_id uuid,
  legacy_source_interest_id text,
  member_status text not null default 'ACTIVE'
    check (member_status in ('ACTIVE', 'REMOVED', 'ARCHIVED')),
  confirmed_by_user_id uuid references public.app_users(id) on delete set null,
  confirmed_by_username text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists team_members_active_once_idx
  on public.team_members (team_profile_id, lower(player_username))
  where member_status = 'ACTIVE';

create table if not exists public.team_membership_requests (
  id uuid primary key default gen_random_uuid(),
  legacy_request_id text unique,
  club_team_id uuid references public.club_teams(id) on delete set null,
  legacy_club_team_id text,
  club_team_name text,
  player_user_id uuid references public.app_users(id) on delete set null,
  player_username text not null,
  player_display_name text,
  player_email text,
  player_phone text,
  player_country text,
  player_profile_id uuid references public.player_profiles(id) on delete set null,
  legacy_player_profile_id text,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  requested_at timestamptz,
  reviewed_by_user_id uuid references public.app_users(id) on delete set null,
  reviewed_by_username text,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists team_membership_requests_pending_once_idx
  on public.team_membership_requests (legacy_club_team_id, lower(player_username))
  where status = 'PENDING';

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  legacy_tournament_id text unique,
  name text not null,
  country text,
  city text,
  start_date date,
  end_date date,
  registration_deadline timestamptz,
  visibility text,
  status text,
  organizer_user_id uuid references public.app_users(id) on delete set null,
  organizer_username text,
  public_code text unique,
  published boolean not null default false,
  published_at timestamptz,
  tournament_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_needs (
  id uuid primary key default gen_random_uuid(),
  legacy_need_id text unique,
  team_profile_id uuid references public.team_profiles(id) on delete cascade,
  legacy_team_profile_id text,
  club_team_id uuid references public.club_teams(id) on delete set null,
  legacy_club_team_id text,
  club_team_name text,
  captain_user_id uuid references public.app_users(id) on delete set null,
  captain_username text,
  need_type text not null default 'PLAYER'
    check (need_type in ('PLAYER', 'SUBSTITUTE', 'TRAINING_PLAYER')),
  need_text text,
  needed_count integer not null default 1 check (needed_count > 0),
  status text not null default 'OPEN'
    check (status in ('OPEN', 'CLOSED', 'ARCHIVED')),
  visibility text not null default 'internal'
    check (visibility in ('internal', 'published')),
  is_published boolean not null default false,
  need_context text not null default 'general'
    check (need_context in ('general', 'training', 'tournament')),
  tournament_id uuid references public.tournaments(id) on delete set null,
  legacy_tournament_id text,
  tournament_name text,
  squad_label text,
  class_name text,
  deadline_at timestamptz,
  source_type text,
  published_at timestamptz,
  public_visible boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_need_interests (
  id uuid primary key default gen_random_uuid(),
  legacy_interest_id text unique,
  need_id uuid references public.team_needs(id) on delete cascade,
  legacy_need_id text,
  team_profile_id uuid references public.team_profiles(id) on delete set null,
  legacy_team_profile_id text,
  club_team_id uuid references public.club_teams(id) on delete set null,
  legacy_club_team_id text,
  club_team_name text,
  player_user_id uuid references public.app_users(id) on delete set null,
  player_username text not null,
  player_display_name text,
  player_email text,
  player_phone text,
  player_country text,
  message text,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED')),
  reviewed_by_user_id uuid references public.app_users(id) on delete set null,
  reviewed_by_username text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists team_need_interests_pending_once_idx
  on public.team_need_interests (need_id, lower(player_username))
  where status = 'PENDING';

create table if not exists public.tournament_events (
  id uuid primary key default gen_random_uuid(),
  legacy_plan_id text unique,
  tournament_id uuid references public.tournaments(id) on delete set null,
  legacy_tournament_id text,
  tournament_name text,
  team_profile_id uuid references public.team_profiles(id) on delete cascade,
  legacy_team_profile_id text,
  club_team_id uuid references public.club_teams(id) on delete set null,
  legacy_club_team_id text,
  club_team_name text,
  captain_user_id uuid references public.app_users(id) on delete set null,
  captain_username text,
  squad_label text,
  class_name text,
  status text not null default 'INVITING'
    check (status in ('DRAFT', 'INVITING', 'READY', 'CANCELLED')),
  deadline_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tournament_availability (
  id uuid primary key default gen_random_uuid(),
  legacy_availability_id text unique,
  event_id uuid references public.tournament_events(id) on delete cascade,
  legacy_plan_id text,
  tournament_id uuid references public.tournaments(id) on delete set null,
  legacy_tournament_id text,
  tournament_name text,
  team_profile_id uuid references public.team_profiles(id) on delete set null,
  legacy_team_profile_id text,
  club_team_id uuid references public.club_teams(id) on delete set null,
  legacy_club_team_id text,
  club_team_name text,
  player_user_id uuid references public.app_users(id) on delete set null,
  player_username text not null,
  player_display_name text,
  player_email text,
  player_phone text,
  player_country text,
  response_status text not null default 'PENDING'
    check (response_status in ('PENDING', 'YES', 'NO', 'MAYBE')),
  preferred_squad text not null default 'NO_PREFERENCE'
    check (preferred_squad in ('A', 'B', 'C', 'RESERVE', 'NO_PREFERENCE')),
  player_note text,
  requested_by_user_id uuid references public.app_users(id) on delete set null,
  requested_by_username text,
  requested_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tournament_availability_once_idx
  on public.tournament_availability (event_id, lower(player_username));

create table if not exists public.tournament_squad_planning (
  id uuid primary key default gen_random_uuid(),
  legacy_planning_id text unique,
  event_id uuid references public.tournament_events(id) on delete cascade,
  legacy_plan_id text,
  tournament_id uuid references public.tournaments(id) on delete set null,
  legacy_tournament_id text,
  tournament_name text,
  team_profile_id uuid references public.team_profiles(id) on delete set null,
  legacy_team_profile_id text,
  club_team_id uuid references public.club_teams(id) on delete set null,
  legacy_club_team_id text,
  club_team_name text,
  player_user_id uuid references public.app_users(id) on delete set null,
  player_username text not null,
  player_display_name text,
  player_country text,
  availability_status text not null
    check (availability_status in ('YES', 'MAYBE', 'PENDING')),
  preferred_squad text not null default 'NO_PREFERENCE'
    check (preferred_squad in ('A', 'B', 'C', 'RESERVE', 'NO_PREFERENCE')),
  assigned_squad text not null default 'UNASSIGNED'
    check (assigned_squad in ('A', 'B', 'C', 'RESERVE', 'UNASSIGNED')),
  planning_status text not null default 'PLANNED'
    check (planning_status in ('PLANNED', 'REMOVED')),
  assigned_by_user_id uuid references public.app_users(id) on delete set null,
  assigned_by_username text,
  assigned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tournament_squad_planning_once_idx
  on public.tournament_squad_planning (event_id, lower(player_username));

create table if not exists public.roster_drafts (
  id uuid primary key default gen_random_uuid(),
  legacy_roster_id text unique,
  event_id uuid references public.tournament_events(id) on delete cascade,
  legacy_plan_id text,
  tournament_id uuid references public.tournaments(id) on delete set null,
  legacy_tournament_id text,
  tournament_name text,
  team_profile_id uuid references public.team_profiles(id) on delete set null,
  legacy_team_profile_id text,
  club_team_id uuid references public.club_teams(id) on delete set null,
  legacy_club_team_id text,
  club_team_name text,
  squad_label text,
  captain_user_id uuid references public.app_users(id) on delete set null,
  captain_username text,
  roster_status text not null default 'DRAFT'
    check (roster_status in ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'LOCKED', 'CANCELLED')),
  submitted_by_user_id uuid references public.app_users(id) on delete set null,
  submitted_by_username text,
  submitted_at timestamptz,
  reviewed_by_user_id uuid references public.app_users(id) on delete set null,
  reviewed_by_username text,
  reviewed_at timestamptz,
  admin_note text,
  locked_at timestamptz,
  locked_by_user_id uuid references public.app_users(id) on delete set null,
  locked_by_username text,
  lock_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roster_players (
  id uuid primary key default gen_random_uuid(),
  legacy_roster_player_id text unique,
  roster_id uuid references public.roster_drafts(id) on delete cascade,
  legacy_roster_id text,
  event_id uuid references public.tournament_events(id) on delete set null,
  legacy_plan_id text,
  tournament_id uuid references public.tournaments(id) on delete set null,
  legacy_tournament_id text,
  tournament_name text,
  team_profile_id uuid references public.team_profiles(id) on delete set null,
  legacy_team_profile_id text,
  club_team_id uuid references public.club_teams(id) on delete set null,
  legacy_club_team_id text,
  club_team_name text,
  squad_label text,
  player_user_id uuid references public.app_users(id) on delete set null,
  player_username text not null,
  player_display_name text,
  player_country text,
  assigned_squad text not null check (assigned_squad in ('A', 'B', 'C', 'RESERVE')),
  roster_role text not null default 'PLAYER' check (roster_role in ('PLAYER', 'RESERVE')),
  source text not null default 'SQUAD_PLANNING'
    check (source in ('SQUAD_PLANNING', 'MANUAL_LATER')),
  player_status text not null default 'ACTIVE'
    check (player_status in ('ACTIVE', 'REMOVED')),
  added_by_user_id uuid references public.app_users(id) on delete set null,
  added_by_username text,
  added_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists roster_players_active_once_idx
  on public.roster_players (roster_id, lower(player_username))
  where player_status = 'ACTIVE';

create table if not exists public.official_rosters (
  id uuid primary key default gen_random_uuid(),
  legacy_official_roster_id text unique,
  draft_id uuid references public.roster_drafts(id) on delete set null,
  legacy_draft_id text,
  tournament_id uuid references public.tournaments(id) on delete set null,
  legacy_tournament_id text,
  tournament_name text,
  club_team_id uuid references public.club_teams(id) on delete set null,
  legacy_team_id text,
  team_name text,
  squad_label text,
  group_name text,
  player_user_id uuid references public.app_users(id) on delete set null,
  player_username text not null,
  player_display_name text,
  player_country text,
  status text not null default 'LOCKED' check (status in ('LOCKED')),
  locked_at timestamptz,
  locked_by_user_id uuid references public.app_users(id) on delete set null,
  locked_by_username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_comments (
  id uuid primary key default gen_random_uuid(),
  legacy_comment_id text unique,
  event_id uuid references public.tournament_events(id) on delete cascade,
  legacy_plan_id text,
  team_profile_id uuid references public.team_profiles(id) on delete set null,
  legacy_team_profile_id text,
  club_team_id uuid references public.club_teams(id) on delete set null,
  legacy_club_team_id text,
  club_team_name text,
  user_id uuid references public.app_users(id) on delete set null,
  username text not null,
  display_name text,
  message text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.app_users(id) on delete set null,
  actor_username text,
  action text not null,
  entity_table text,
  entity_id uuid,
  legacy_entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists app_users_username_lower_idx on public.app_users (lower(username));
create index if not exists app_users_role_active_idx on public.app_users (role, active);
create index if not exists player_profiles_username_idx on public.player_profiles (lower(username));
create index if not exists player_profiles_club_team_idx on public.player_profiles (club_team_id);
create index if not exists access_requests_status_idx on public.access_requests (status, request_type);
create index if not exists access_requests_username_idx on public.access_requests (lower(username));
create index if not exists team_identity_change_requests_status_idx on public.team_identity_change_requests (status, created_at);
create index if not exists team_profiles_club_team_idx on public.team_profiles (club_team_id);
create index if not exists team_profiles_captain_idx on public.team_profiles (lower(captain_username));
create index if not exists team_members_team_status_idx on public.team_members (team_profile_id, member_status);
create index if not exists team_members_player_idx on public.team_members (lower(player_username));
create index if not exists team_membership_requests_team_status_idx on public.team_membership_requests (club_team_id, status);
create index if not exists team_needs_team_status_idx on public.team_needs (team_profile_id, status);
create index if not exists team_needs_tournament_idx on public.team_needs (tournament_id, status);
create index if not exists team_needs_public_ads_idx on public.team_needs (visibility, need_context, status, is_published);
create index if not exists team_need_interests_need_status_idx on public.team_need_interests (need_id, status);
create index if not exists tournaments_status_idx on public.tournaments (status, published);
create index if not exists tournament_events_team_status_idx on public.tournament_events (team_profile_id, status);
create index if not exists tournament_events_tournament_idx on public.tournament_events (tournament_id);
create index if not exists tournament_events_legacy_plan_idx on public.tournament_events (legacy_plan_id);
create index if not exists tournament_availability_player_idx on public.tournament_availability (lower(player_username), response_status);
create index if not exists tournament_availability_event_idx on public.tournament_availability (event_id, response_status);
create index if not exists tournament_availability_legacy_plan_idx on public.tournament_availability (legacy_plan_id, response_status);
create index if not exists tournament_squad_planning_event_idx on public.tournament_squad_planning (event_id, assigned_squad, planning_status);
create index if not exists tournament_squad_planning_legacy_plan_idx on public.tournament_squad_planning (legacy_plan_id, assigned_squad);
create index if not exists roster_drafts_event_status_idx on public.roster_drafts (event_id, roster_status);
create index if not exists roster_drafts_legacy_plan_status_idx on public.roster_drafts (legacy_plan_id, roster_status);
create index if not exists roster_drafts_review_idx on public.roster_drafts (roster_status, reviewed_at);
create index if not exists roster_players_roster_idx on public.roster_players (roster_id, assigned_squad);
create index if not exists official_rosters_player_idx on public.official_rosters (lower(player_username), status);
create index if not exists official_rosters_tournament_idx on public.official_rosters (tournament_id, club_team_id);
create index if not exists event_comments_event_idx on public.event_comments (event_id, active, created_at);
create index if not exists event_comments_legacy_plan_idx on public.event_comments (legacy_plan_id, active, created_at);
create index if not exists audit_log_entity_idx on public.audit_log (entity_table, entity_id, created_at);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'app_users',
    'club_teams',
    'player_profiles',
    'access_requests',
    'team_profiles',
    'team_identity_change_requests',
    'team_members',
    'team_membership_requests',
    'tournaments',
    'team_needs',
    'team_need_interests',
    'tournament_events',
    'tournament_availability',
    'tournament_squad_planning',
    'roster_drafts',
    'roster_players',
    'official_rosters',
    'event_comments',
    'audit_log'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end $$;
