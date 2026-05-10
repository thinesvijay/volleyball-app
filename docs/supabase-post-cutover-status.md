# Supabase Post-Cutover Status

Make Teams Pro is now in Apps Script-wrapped Supabase mode. React still calls the same Apps Script web app URL, and Apps Script chooses Supabase or Google Sheets from Script Properties.

## Full Supabase Mode

Set these Apps Script Script Properties:

```text
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
AUTH_BACKEND=supabase
PLAYER_HUB_BACKEND=supabase
TEAM_BUILDER_BACKEND=supabase
TOURNAMENT_BACKEND=supabase
```

When all four backend properties are `supabase`, Apps Script should use Supabase for Auth, Player Hub, Team Builder, and Tournament runtime data. Google Sheets should only appear when a real fallback error is reported.

## Rollback

Rollback stays property-only:

```text
AUTH_BACKEND=sheets
PLAYER_HUB_BACKEND=sheets
TEAM_BUILDER_BACKEND=sheets
TOURNAMENT_BACKEND=sheets
```

You can roll back one area at a time by changing only that module property to `sheets`.

## Status Checks

Run:

```powershell
npm.cmd run supabase:post-cutover-check
```

This reports:

- backend modes returned by Apps Script
- global imported Supabase counts
- user-visible API counts for the configured admin account
- fallback status

The global counts and user-visible counts are intentionally separate. For example, Supabase can contain all Team Builder players globally while the current admin user only sees the players owned by that account.

## Apps Script Status Action

`Code.gs` includes an admin-only action:

```text
getBackendStatus
```

It returns:

- auth backend mode
- Player Hub backend mode
- Team Builder backend mode
- Tournament backend mode
- whether all modes are Supabase
- Supabase global counts
- user-visible counts
- rollback hints

Deploy `Code.gs` before relying on this action from the local check script.

## What Still Uses Apps Script

Apps Script remains the API wrapper for:

- login and user/session checks
- Player Hub actions
- Team Builder actions
- Tournament actions
- public tournament reads

Supabase keys stay server-side in Apps Script Script Properties and local gitignored env files only.

## Google Sheets Dependency

Google Sheets remains available as rollback/fallback. It should not be the active source of truth while all backend properties are set to `supabase`.

## Safe To Delete Later

Do not delete yet, but later cleanup candidates include:

- Google Sheets write paths after a longer Supabase burn-in
- Sheet migration/export helpers after final archive
- Apps Script fallback branches after rollback is no longer needed
- local import scripts after production migration is fully complete
