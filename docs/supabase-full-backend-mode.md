# Supabase Full Backend Mode

This is the consolidated Make Teams Pro backend switch plan after the Player Hub, Tournament, Team Builder, and Auth migrations.

React still calls Apps Script. Supabase keys stay only in Apps Script Script Properties and local gitignored env files.

## Backend Modes

Set these Apps Script Properties for full Supabase mode:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PLAYER_HUB_BACKEND=supabase
TOURNAMENT_BACKEND=supabase
TEAM_BUILDER_BACKEND=supabase
AUTH_BACKEND=supabase
```

Rollback is per-area:

```text
PLAYER_HUB_BACKEND=sheets
TOURNAMENT_BACKEND=sheets
TEAM_BUILDER_BACKEND=sheets
AUTH_BACKEND=sheets
```

Missing mode properties default to Google Sheets.

## One-Time SQL

Run this in Supabase SQL editor before the full switch:

```sql
-- paste and run:
-- supabase/final-backend-consolidation-schema.sql
```

This idempotent migration ensures:

- Auth/user compatibility columns on `app_users`
- Team Builder tables:
  - `team_builder_players`
  - `team_builder_saved_teams`
- RLS remains enabled
- no anon/public policies are created

If you already ran the separate auth and Team Builder migration files, this final file is still safe to run.

## Newly Covered In This Pass

- `registerPlayerAccount` can create Supabase `app_users` and `player_profiles`
- `generateTraining` reads Supabase Team Builder players and saves generated teams to Supabase when Team Builder mode is Supabase
- `generateWebTeams` reads Supabase Team Builder players when Team Builder mode is Supabase
- approved access request side effects avoid writing Users sheet when `AUTH_BACKEND=supabase`
- combined read-only backend status script:
  - `npm.cmd run supabase:test:full-backend-mode`

## Still Kept On Sheets / Fallback

These are intentionally retained:

- Google Sheets fallback for every migrated backend mode
- trainer spreadsheet creation on `createTrainerUser`, so rollback still has a trainer workbook
- legacy Apps Script menu/macros such as `onOpen`
- tournament public/live fallback functions when `TOURNAMENT_BACKEND=sheets`

## Local Checks

After deploying `Code.gs`:

```powershell
npm.cmd run supabase:test:full-backend-mode
npm.cmd run test:e2e
```

The full backend test is read-only. It calls:

- `login`
- `getProfile`
- `getPlayerHubSnapshot`
- `getPlayers`
- `listTournaments`
- `listPublicTournaments`
- `listTrainerUsers`

It prints which backend/source each surface reports plus key counts.

## Safety Notes

- Do not put Supabase keys in React.
- Do not change the Apps Script web app URL.
- Do not remove Google Sheets fallback until a longer beta has passed.
- Confirm `app_users.password_hash` is populated before relying on `AUTH_BACKEND=supabase`.
