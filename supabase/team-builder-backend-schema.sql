-- Make Teams Pro Team Builder backend tables.
-- Run this in the Supabase SQL editor before setting TEAM_BUILDER_BACKEND=supabase.

create extension if not exists pgcrypto;

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

alter table public.team_builder_players enable row level security;
alter table public.team_builder_saved_teams enable row level security;

-- No anon/public policies are created here.
-- During the Apps Script migration phase, the server-side service_role key bypasses RLS.
