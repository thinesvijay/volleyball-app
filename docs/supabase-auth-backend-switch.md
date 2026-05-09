# Supabase Auth / Users Backend Switch

This is the server-side switch for moving Make Teams Pro users, login, access flags, and trainer-admin management behind Apps Script from Google Sheets to Supabase. React still calls the same Apps Script URL.

## What Migrates

When `AUTH_BACKEND=supabase`, these actions use Supabase first:

- `login`
- `getProfile`
- `saveUserSettings`
- `listTrainerUsers`
- `createTrainerUser`
- `updateTrainerAccess`
- `updateTrainerStatus`
- `resetTrainerPassword`
- `resetPlayerPassword`
- `archiveTrainerUser`
- `restoreTrainerUser`

The shared auth helpers also read Supabase first in this mode:

- `findUser`
- `getUserByUsername`
- admin checks via `requireAdmin`
- module access checks that depend on the logged-in user

Google Sheets fallback remains in place for rollback and for missing Supabase user rows during the migration.

## One-Time Supabase SQL

Before enabling Auth Supabase mode, run:

```sql
-- Supabase SQL editor
-- paste and run:
-- supabase/auth-users-backend-schema.sql
```

This ensures `app_users` has the compatibility columns Apps Script needs:

- `legacy_username`
- `password_hash`
- `phone`
- `can_request_team_profile`
- `can_use_team_builder`
- `can_use_tournaments`
- `can_create_tournaments`
- `spreadsheet_id`
- `skill_view`
- `skill_scale`
- `archived_at`

RLS stays enabled and no anon/public policies are added. Apps Script uses the server-side service role key from Script Properties.

## Data Requirement

`AUTH_BACKEND=supabase` requires `app_users.password_hash` to contain the same password hash format currently used by Apps Script:

```text
SHA-256 hex of the plain password
```

During transition, if a Supabase login row is missing or does not match, Apps Script falls back to the existing Google Sheets user lookup. That keeps rollback safe, but Supabase should be populated before a longer beta.

## Apps Script Properties

Keep the existing properties:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PLAYER_HUB_BACKEND=supabase
TOURNAMENT_BACKEND=supabase
TEAM_BUILDER_BACKEND=supabase
```

Then add:

```text
AUTH_BACKEND=supabase
```

Rollback:

```text
AUTH_BACKEND=sheets
```

If `AUTH_BACKEND` is missing, the code defaults to Google Sheets.

## Local Check

After deploying `Code.gs`, run:

```powershell
npm.cmd run supabase:test:auth-backend-mode
```

The script is read-only. It calls:

- `login`
- `getProfile`
- `listTrainerUsers`

It reports backend mode, fallback status, role/access fields, trainer count, and whether trainer access fields are present.

## Notes

- Password behavior is intentionally unchanged for now.
- Trainer spreadsheet IDs are preserved in `app_users.spreadsheet_id`.
- Creating a trainer still creates the legacy trainer spreadsheet so rollback remains practical.
- Do not put Supabase keys in React.
- Do not change the frontend API URL.
