# Tournament Supabase Backend Switch

This is the controlled backend-mode switch for Make Teams Pro tournament data.

React still calls the same Apps Script web app URL. Supabase service credentials stay only in Apps Script Script Properties or local gitignored env files. Google Sheets remains the default tournament backend unless a Script Property explicitly switches tournaments to Supabase.

## Backend Mode

Apps Script reads this Script Property:

```text
TOURNAMENT_BACKEND=sheets
```

Supported values:

- `sheets`: default. Tournament actions use the existing Google Sheets backend.
- `supabase`: Tournament actions use Supabase through Apps Script. If the Supabase path fails, Apps Script falls back to Sheets and logs `[TournamentBackend] fallback`.

## Required Script Properties

Set these in **Apps Script -> Project Settings -> Script Properties** before a Supabase tournament beta:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-legacy-service-role-key
PLAYER_HUB_BACKEND=supabase
TOURNAMENT_BACKEND=sheets
```

Switch tournaments only when ready:

```text
TOURNAMENT_BACKEND=supabase
```

Rollback is immediate:

```text
TOURNAMENT_BACKEND=sheets
```

## Migrated Tournament Actions

In `TOURNAMENT_BACKEND=supabase` mode, Apps Script handles these against Supabase:

- `listTournaments`
- `getTournament`
- `saveTournament`
- `publishTournament`
- `unpublishTournament`
- `deleteTournament`
- `cleanupMyDraftTournaments`
- `getPublicTournament`
- `listPublicTournaments`

The Supabase path preserves:

- `TournamentId`
- `PublicCode`
- `OrganizerUsername`
- `Status`
- `Visibility`
- `Published`
- `PublishedAt`
- `UpdatedAt`
- `TournamentJson`

## Safety Rules Preserved

- Private tournament actions still require login and tournament access.
- Tournament owner isolation still uses `OrganizerUsername`.
- Public tournament actions still work without login.
- Published tournaments must be unpublished before delete.
- Cleanup only deletes the current organizer's draft/unpublished tournaments.
- React response shapes remain unchanged, with extra backend metadata only.

## Logs To Watch

Apps Script logs include:

```text
[TournamentBackend] sheets <action>
[TournamentBackend] supabase <action>
[TournamentBackend] fallback <action> <error>
```

## Safe Beta Checklist

1. Confirm latest `Code.gs` is deployed.
2. Confirm Supabase import/compare is current.
3. Keep rollback value handy:

   ```text
   TOURNAMENT_BACKEND=sheets
   ```

4. Set:

   ```text
   TOURNAMENT_BACKEND=supabase
   ```

5. Run:

   ```text
   npm.cmd run supabase:test:tournament-backend-mode
   npm.cmd run test:e2e
   ```

6. Check Apps Script logs for `[TournamentBackend] supabase`.
7. Roll back if anything looks wrong:

   ```text
   TOURNAMENT_BACKEND=sheets
   ```
