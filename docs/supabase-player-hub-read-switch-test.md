# Player Hub Supabase Read Switch Test

This is a local verification step for the Apps Script `getPlayerHubSnapshot` response. It does not connect React directly to Supabase and does not change production behavior.

## What The Test Checks

The local script calls:

```text
getPlayerHubSnapshot
```

through the existing Apps Script web app URL using the admin credentials from `supabase/.env.import`.

It prints:

- success/failure
- source if the API returns one
- key array counts
- whether required Player Hub snapshot fields exist

The current React dashboard expects at least:

- `profile`
- `availableClubs[]`
- `teamNeeds[]`
- `myTeams[]`
- `tournamentAvailability[]`

The script also checks:

- `accessRequests[]`
- `teamMembershipRequests[]`
- `myTeamNeedInterests[]`
- `plannedTeams[]`
- `rosterDraftsForPlayer[]`
- `captainTeamControl`
- `adminCounts`

## Command

```powershell
npm.cmd run supabase:test:player-hub-snapshot-source
```

## Flag-Off Baseline

With Apps Script property:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

run:

```powershell
npm.cmd run supabase:test:player-hub-snapshot-source
```

Expected:

```text
Success: true
Shape valid: true
```

Source may say:

```text
not returned; check Apps Script logs for [Snapshot] source ...
```

That is okay. Apps Script logs should show:

```text
[Snapshot] source sheets
```

## Temporary Supabase Read Test

Only for a short admin/local test window, set Apps Script property:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=true
```

Run:

```powershell
npm.cmd run supabase:test:player-hub-snapshot-source
```

Expected:

```text
Success: true
Shape valid: true
```

Then check Apps Script logs for:

```text
[Snapshot] source supabase
```

If Supabase fails, Apps Script should log:

```text
[Snapshot] Supabase read failed; falling back to sheets
```

and the response should still keep the Player Hub shape.

## Turn The Flag Off

Immediately set:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

Then run:

```powershell
npm.cmd run supabase:test:apps-script-diagnostic
npm.cmd run test:e2e
```

Expected:

```text
Supabase reads enabled: false
4 passed
```

## Rollback

The rollback is:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

Only redeploy an older `Code.gs` if the flag is false and the Google Sheets-backed Player Hub still fails.
