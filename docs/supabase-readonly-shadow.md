# Supabase Read-Only Shadow Inspection

This is the next safe step after the Phase 2 shadow import. The production app still runs through React -> Apps Script -> Google Sheets. These scripts only inspect the Supabase dev project from the local machine.

## Safety

- No React code is connected to Supabase.
- No API URL changes.
- No auth replacement.
- No anon/public policies.
- No service role key in frontend code.
- `supabase/.env.import` remains local and gitignored.
- Apps Script / Google Sheets remains source of truth.

## Commands

Inspect the imported Supabase dev data:

```powershell
npm.cmd run supabase:inspect:player-hub
```

Compare the latest Apps Script export JSON with Supabase rows:

```powershell
npm.cmd run supabase:compare:player-hub
```

If the export JSON is missing or stale, refresh it first:

```powershell
npm.cmd run supabase:export:player-hub
```

## What Inspect Shows

`supabase:inspect:player-hub` reads these dev tables:

- `app_users`
- `player_profiles`
- `club_teams`
- `team_profiles`
- `team_members`
- `team_needs`
- `roster_drafts`
- `roster_players`
- `tournaments`

It prints counts and a small non-secret sample from each table.

## What Compare Checks

`supabase:compare:player-hub` loads:

```text
supabase/.tmp/player-hub-export.json
```

Then it compares exported legacy IDs with Supabase rows:

- usernames -> `app_users.username`
- `ProfileId` -> `player_profiles.legacy_profile_id`
- `TeamId` -> `club_teams.legacy_team_id`
- `TeamProfileId` -> `team_profiles.legacy_team_profile_id`
- `TeamMemberId` -> `team_members.legacy_team_member_id`
- `NeedId` -> `team_needs.legacy_need_id`
- `RosterId` -> `roster_drafts.legacy_roster_id`
- roster player IDs or generated draft/player keys -> `roster_players.legacy_roster_player_id`
- `TournamentId` -> `tournaments.legacy_tournament_id`

The compare script exits non-zero if exported legacy IDs are missing from Supabase. Extra Supabase rows are reported as `extra-ok`, because the dev database may contain seed rows or previous imports.

## Expected Result After A Successful Import

- Inspect shows non-zero rows for imported collections.
- Compare prints `Comparison passed: every exported legacy ID exists in Supabase.`
- The visible app still behaves exactly as before, because it is not reading Supabase.

## If Compare Fails

1. Run `npm.cmd run supabase:export:player-hub`.
2. Run `npm.cmd run supabase:shadow:real-import`.
3. Run `npm.cmd run supabase:compare:player-hub`.

Do not switch Player Hub reads until the shadow comparison is clean and E2E still passes.
