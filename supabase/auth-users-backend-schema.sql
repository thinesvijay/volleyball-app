-- Make Teams Pro Auth / Users backend compatibility columns.
-- Run this in the Supabase SQL editor before setting AUTH_BACKEND=supabase.

create extension if not exists pgcrypto;

alter table public.app_users
  add column if not exists legacy_username text,
  add column if not exists password_hash text,
  add column if not exists phone text,
  add column if not exists can_request_team_profile boolean not null default false,
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
  on public.app_users (can_use_team_builder, can_use_tournaments, can_create_tournaments);

alter table public.app_users enable row level security;

-- No anon/public policies are created here.
-- During the Apps Script migration phase, the server-side service_role key bypasses RLS.
