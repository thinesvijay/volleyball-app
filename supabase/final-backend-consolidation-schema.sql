-- Make Teams Pro final backend consolidation helpers.
-- This file is idempotent and safe to run after the main schema.
-- It gathers the compatibility pieces needed by the Apps Script backend switches.

create extension if not exists pgcrypto;

-- Auth / Users compatibility.
alter table public.app_users
  add column if not exists legacy_username text,
  add column if not exists password_hash text,
  add column if not exists phone text,
  add column if not exists can_request_team_profile boolean not null default false,
  add column if not exists can_use_team_builder boolean not null default false,
  add column if not exists can_use_tournaments boolean not null default false,
  add column if not exists can_create_tournaments boolean not null default false,
  add column if not exists spreadsheet_id text,
  add column if not exists skill_view text,
  add column if not exists skill_scale integer,
  add column if not exists archived_at timestamptz;

update public.app_users
set legacy_username = username
where legacy_username is null;

create unique index if not exists app_users_legacy_username_unique_idx
  on public.app_users (lower(legacy_username))
  where legacy_username is not null;

create index if not exists app_users_role_active_idx
  on public.app_users (role, active);

create index if not exists app_users_access_idx
  on public.app_users (
    can_use_team_builder,
    can_use_tournaments,
    can_create_tournaments
  );

-- Team Builder backend tables.
create table if not exists public.team_builder_players (
  id uuid primary key default gen_random_uuid(),
  legacy_player_id text unique,
  owner_username text not null,
  owner_display_name text,
  active boolean not null default true,
  name text not null,
  skill integer not null default 1,
  cannot_play_with text[] not null default '{}'::text[],
  club text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_builder_players_owner_idx
  on public.team_builder_players (lower(owner_username));

create index if not exists team_builder_players_owner_active_idx
  on public.team_builder_players (lower(owner_username), active);

create index if not exists team_builder_players_owner_name_idx
  on public.team_builder_players (lower(owner_username), lower(btrim(name)));

create table if not exists public.team_builder_saved_teams (
  id uuid primary key default gen_random_uuid(),
  legacy_saved_team_id text unique,
  owner_username text not null,
  label text,
  teams_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_builder_saved_teams_owner_idx
  on public.team_builder_saved_teams (lower(owner_username));

alter table public.app_users enable row level security;
alter table public.team_builder_players enable row level security;
alter table public.team_builder_saved_teams enable row level security;

-- No anon/public policies are created here.
-- Apps Script uses the server-side service_role key during this migration phase.
