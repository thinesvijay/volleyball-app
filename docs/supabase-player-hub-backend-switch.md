# Player Hub Supabase Backend Switch

This is the first controlled backend-mode step for Make Teams Pro Player Hub.

The React app still calls the same Apps Script web app URL. Supabase service credentials stay only in Apps Script Script Properties or local gitignored env files. Google Sheets remains the default backend unless a Script Property explicitly switches Player Hub to Supabase.

## Backend Mode

Apps Script reads this Script Property:

```text
PLAYER_HUB_BACKEND=sheets
```

Supported values:

- `sheets`: default. Player Hub uses the existing Google Sheets backend.
- `supabase`: Player Hub snapshot and migrated Player Hub actions use Supabase through Apps Script. Unsupported writes fall back to the existing Sheets action and log `[PlayerHubBackend] fallback`.

The older diagnostic flag `SUPABASE_PLAYER_HUB_READS_ENABLED=true` can still test read-only Supabase snapshot reads, but the one clear beta switch is now `PLAYER_HUB_BACKEND=supabase`.

## Required Script Properties

Set these in **Apps Script -> Project Settings -> Script Properties** before a Supabase beta:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-legacy-service-role-key
PLAYER_HUB_BACKEND=sheets
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

Then switch only when ready:

```text
PLAYER_HUB_BACKEND=supabase
```

Rollback is immediate:

```text
PLAYER_HUB_BACKEND=sheets
```

## Migrated In This Step

Supabase mode now handles these through Apps Script:

- `getPlayerHubSnapshot`
- player profile reads and save
- club/team list reads
- visible published player ads reads
- access request reads, create, and admin review
- Team Control read/detail loaders
- team profile save/admin review
- team identity change request/review
- internal team need and published player ad writes
- team need interest create/review
- team member add/remove from accepted interest
- team membership request create/review/cancel
- team members and membership request read loaders
- tournament availability read loaders
- player RSVP response write
- tournament team plan create/status writes
- squad planning read/write loaders
- roster draft/status/review reads and writes
- roster draft create/update/submit/cancel
- roster review approve/reject
- official roster lock
- event comment reads
- add/archive event comment writes
- compact audit log inserts for migrated Player Hub writes

The response shape remains the existing React contract.

## Still Using Sheets Fallback

Google Sheets remains the default when `PLAYER_HUB_BACKEND` is missing or set to
`sheets`. In Supabase mode, the known Player Hub / Team Hub read and write
surface is routed to Supabase. Any unrecognized legacy action still falls back
to the existing Sheets action and logs `[PlayerHubBackend] fallback` so rollback
stays simple during beta.

## Logs To Watch

Apps Script logs include:

```text
[PlayerHubBackend] sheets
[PlayerHubBackend] supabase <action>
[PlayerHubBackend] fallback <action>
[Snapshot] source supabase
[Snapshot] source sheets
```

## Safe Beta Checklist

1. Confirm latest `Code.gs` is deployed.
2. Confirm Supabase import/compare is current:

   ```text
   npm.cmd run supabase:snapshot:player-hub
   npm.cmd run supabase:compare:player-hub
   ```

3. Set Apps Script property:

   ```text
   PLAYER_HUB_BACKEND=supabase
   ```

4. Run:

   ```text
   npm.cmd run supabase:test:player-hub-backend-mode
   npm.cmd run test:e2e
   ```

5. Check Apps Script logs for `[PlayerHubBackend] supabase`.
6. Roll back after the beta:

   ```text
   PLAYER_HUB_BACKEND=sheets
   ```

7. Confirm rollback:

   ```text
   npm.cmd run supabase:test:player-hub-backend-mode
   npm.cmd run test:e2e
   ```
