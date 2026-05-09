# Supabase Full Backend Data Import

This workflow copies the current Google Sheets backend data into Supabase dev while keeping the running app on the existing Apps Script API wrapper.

It covers:

- Users, trainer access flags, and legacy spreadsheet IDs
- Team Builder players and saved teams from the main sheet plus trainer spreadsheets
- Private and public tournaments
- Player Hub / Team Hub data
- Team membership, needs, tournament availability, planning, roster drafts, locked rosters, and comments

## Safety

- Do not commit `supabase/.env.import`.
- Do not print or paste the service role key into chat, docs, or code.
- React still calls Apps Script. The API URL does not change.
- Google Sheets fallback stays in place.
- Supabase import uses legacy IDs/usernames so reruns are idempotent where tables have a legacy unique key.

## One-time Apps Script deploy

Deploy the current `Code.gs` before running the full export. The exporter calls:

```text
exportAllSheetsDataForSupabaseMigration
```

That action reads Google Sheets directly, even when backend modes are currently set to Supabase.

## Dry run first

Keep this in `supabase/.env.import`:

```text
SUPABASE_IMPORT_DRY_RUN=true
```

Then run:

```powershell
npm.cmd run supabase:export:all
npm.cmd run supabase:import:all
npm.cmd run supabase:validate:all
```

The import dry run validates table payload shape and row keys without writing rows. Validation may report old Supabase counts during dry run because no rows were changed.

## Real import

After dry run succeeds, set:

```text
SUPABASE_IMPORT_DRY_RUN=false
```

Run:

```powershell
npm.cmd run supabase:import:all
npm.cmd run supabase:validate:all
```

Then run the app checks:

```powershell
npm.cmd run supabase:test:full-backend-mode
npm.cmd run test:e2e
npm.cmd run build
```

## Expected validation areas

`supabase:validate:all` compares the export file with Supabase row counts for:

- `app_users`
- `team_builder_players`
- `team_builder_saved_teams`
- Player Hub / Team Hub tables
- Tournament event, roster, and comment tables
- `tournaments`

Counts can be higher than the export after repeated testing. They should not be lower after the real import.

## Full Supabase mode properties

When the import is complete and validation passes, Apps Script can stay in full Supabase mode with:

```text
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
PLAYER_HUB_BACKEND=supabase
TOURNAMENT_BACKEND=supabase
TEAM_BUILDER_BACKEND=supabase
AUTH_BACKEND=supabase
```

Rollback is still:

```text
PLAYER_HUB_BACKEND=sheets
TOURNAMENT_BACKEND=sheets
TEAM_BUILDER_BACKEND=sheets
AUTH_BACKEND=sheets
```
