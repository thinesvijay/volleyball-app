# Player Hub Supabase Read Service

This is a local-only development layer for inspecting the Supabase dev copy of Player Hub data. It does not connect the React app to Supabase and does not change production behavior.

## What It Does

- Reads key Player Hub tables from Supabase dev using `supabase/.env.import`.
- Builds a JSON snapshot at `supabase/.tmp/player-hub-supabase-snapshot.json`.
- Lets the existing compare script verify Apps Script export data against that Supabase snapshot by legacy IDs and row counts.
- Keeps Apps Script and Google Sheets as the current source of truth.

## Commands

Create a read-only Supabase snapshot:

```powershell
npm.cmd run supabase:snapshot:player-hub
```

Compare the latest Apps Script export to the Supabase snapshot:

```powershell
npm.cmd run supabase:compare:player-hub
```

If the snapshot file is missing, the compare script can still read Supabase live, but the preferred dev flow is:

```powershell
npm.cmd run supabase:export:player-hub
npm.cmd run supabase:snapshot:player-hub
npm.cmd run supabase:compare:player-hub
```

## Tables Read

- `app_users`
- `player_profiles`
- `club_teams`
- `team_profiles`
- `team_members`
- `team_needs`
- `roster_drafts`
- `roster_players`
- `tournaments`

## Safety Notes

- This service runs in Node scripts only.
- It uses the local `supabase/.env.import` file, which must stay gitignored.
- Do not use the service role key in frontend code.
- Do not add anon policies for this shadow read layer.
- Do not switch the visible app to Supabase reads until a later migration phase.

## Next Step

After each new Google Sheets export/import, run the snapshot and compare commands to confirm the Supabase dev copy still matches the current Apps Script data.
