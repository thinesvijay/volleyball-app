# Supabase Team Builder Backend Switch

This is the server-side switch for moving Team Builder data behind Apps Script from Google Sheets to Supabase. React still calls the same Apps Script URL.

## What Migrates

When `TEAM_BUILDER_BACKEND=supabase`, these Team Builder actions use Supabase:

- `getPlayers`
- `addPlayer`
- `saveSkills`
- `updatePlayerName`
- `updatePlayer`
- `archivePlayer`
- `restorePlayer`
- `saveTeams`

The `generate` action stays unchanged because it is pure calculation over the players React sends in the request.

## One-Time Supabase SQL

Before enabling Supabase mode, run:

```sql
-- Supabase SQL editor
-- paste and run:
-- supabase/team-builder-backend-schema.sql
```

The migration creates:

- `team_builder_players`
- `team_builder_saved_teams`

RLS is enabled, but no anon/public policies are added. Apps Script uses the server-side service role key from Script Properties.

## Apps Script Properties

Keep the existing properties:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PLAYER_HUB_BACKEND=supabase
TOURNAMENT_BACKEND=supabase
```

Then add:

```text
TEAM_BUILDER_BACKEND=supabase
```

Rollback:

```text
TEAM_BUILDER_BACKEND=sheets
```

If `TEAM_BUILDER_BACKEND` is missing, the code defaults to Google Sheets.

## Local Check

After deploying `Code.gs`, run:

```powershell
npm.cmd run supabase:test:team-builder-backend-mode
```

The script is read-only. It calls `getPlayers` with admin credentials from `supabase/.env.import` and prints:

- backend mode returned by Apps Script
- fallback status
- active player count
- archived player count
- unauthenticated access enforcement check

## Notes

- Team Builder trainer isolation is preserved with `owner_username`.
- Admin/global Team Builder data uses `__main__` when the admin has no trainer spreadsheet ID.
- Existing Google Sheets logic remains in place for rollback.
- Do not put Supabase keys in React.
- Do not change the frontend API URL.
