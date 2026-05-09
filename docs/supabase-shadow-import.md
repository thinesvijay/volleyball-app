# Supabase Shadow Import Setup

This is Phase 2 of the Make Teams Pro Player Hub migration. It copies data from the current Apps Script/Google Sheets system into the Supabase dev project for comparison and performance testing. It does not change production app behavior.

## Safety Rules

- Apps Script and Google Sheets remain the source of truth.
- React still calls the existing Apps Script API URL.
- No Supabase client code is added to the frontend.
- The Supabase service role key is used only from a local gitignored env file.
- Import defaults to dry-run mode.
- RLS may be enabled in Supabase, but these scripts use the service role key for local migration work only.

## Files

- `supabase/.env.import.example` - template for local secrets.
- `scripts/supabase/export-player-hub-from-apps-script.js` - exports what current Apps Script admin actions expose, or creates a manual JSON template.
- `scripts/supabase/import-player-hub-to-supabase.js` - upserts export JSON into Supabase using legacy IDs.
- `scripts/supabase/validate-supabase-import.js` - prints Supabase row counts and compares them with the export JSON when present.
- `supabase/import-checklist.sql` - read-only SQL checks for the Supabase SQL editor.

## One-Time Local Setup

Copy the env template:

```powershell
Copy-Item supabase\.env.import.example supabase\.env.import
```

Fill:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Optional Apps Script export credentials:

```text
APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/.../exec
APPS_SCRIPT_ADMIN_USERNAME=...
APPS_SCRIPT_ADMIN_PASSWORD=...
```

Do not commit `supabase/.env.import`.

## Export Current Apps Script Data

Run:

```powershell
npm.cmd run supabase:export:player-hub
```

If Apps Script admin credentials are configured, the exporter calls existing read actions:

- `listClubTeamsAdmin`
- `listPlayerProfilesForAdmin`
- `listAccessRequestsAdmin`
- `listTeamIdentityChangeRequests`
- `listTeamProfilesAdmin`
- `listVisibleTeamNeeds`
- `listTeamNeedInterestsAdmin`
- `listTeamMembersAdmin`
- `listTeamMembershipRequestsAdmin`
- `listSubmittedRosterDraftsForReview`

Current Apps Script does not expose every raw Sheet as an admin export action. The exporter records unavailable collections in the JSON, including full internal team needs, tournament plans, availability rows, squad planning rows, roster player rows, official roster rows, and event comments when they cannot be fetched directly.

If credentials are missing, the exporter creates a manual template at:

```text
supabase/.tmp/player-hub-export.json
```

You can fill that JSON from Sheet CSV exports without changing production code.

## Import Into Supabase Dev

The import script is dry-run by default:

```powershell
npm.cmd run supabase:import:player-hub
```

It prints which tables it would upsert. No Supabase rows are changed while:

```text
SUPABASE_IMPORT_DRY_RUN=true
```

To run a real dev import:

```powershell
$env:SUPABASE_IMPORT_DRY_RUN = "false"
npm.cmd run supabase:import:player-hub
Remove-Item Env:\SUPABASE_IMPORT_DRY_RUN
```

Or set `SUPABASE_IMPORT_DRY_RUN=false` in `supabase/.env.import` temporarily.

## Validation

Run:

```powershell
npm.cmd run supabase:validate:player-hub
```

The validator:

- prints row counts for the Player Hub tables,
- compares counts against `supabase/.tmp/player-hub-export.json` when that file exists,
- exits non-zero if a table has fewer rows than the export for mapped collections.

Also run the SQL checklist in Supabase:

```text
supabase/import-checklist.sql
```

Useful checks:

- row counts by table,
- team need visibility/context split,
- access request statuses,
- tournament availability statuses,
- squad planning assignment statuses,
- roster draft statuses,
- duplicate active memberships,
- duplicate active roster player rows.

## Legacy ID Strategy

The import preserves Apps Script/Sheets IDs in `legacy_*` columns:

- `ClubTeams.TeamId` -> `club_teams.legacy_team_id`
- `PlayerProfiles.ProfileId` -> `player_profiles.legacy_profile_id`
- `TeamProfiles.TeamProfileId` -> `team_profiles.legacy_team_profile_id`
- `TeamNeeds.NeedId` -> `team_needs.legacy_need_id`
- `TournamentTeamPlans.PlanId` -> `tournament_events.legacy_plan_id`
- `TournamentRosters.RosterId` -> `roster_drafts.legacy_roster_id`
- `TournamentRosterPlayers.RosterPlayerId` -> `roster_players.legacy_roster_player_id`
- `OfficialRosters.OfficialRosterId` -> `official_rosters.legacy_official_roster_id`
- `TeamEventComments.CommentId` -> `event_comments.legacy_comment_id`

Usernames are normalized lowercase for joins. The original Apps Script username is kept as `app_users.legacy_username` where available.

## Status Normalization

The importer normalizes known status values into the schema checks:

- access: `PENDING`, `APPROVED`, `REJECTED`
- membership: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`
- team needs: `OPEN`, `CLOSED`, `ARCHIVED`
- interests: `PENDING`, `ACCEPTED`, `DECLINED`, `CANCELLED`
- availability: `PENDING`, `YES`, `MAYBE`, `NO`
- squad assignment: `A`, `B`, `C`, `RESERVE`, `UNASSIGNED`
- roster: `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `LOCKED`, `CANCELLED`

Old team needs default to:

```text
visibility = internal
need_context = general
```

unless the source row explicitly says it is published or tournament-linked.

## Current Limitations

The current Apps Script admin API is optimized for the app UI, not a full raw Sheet export. For a complete shadow import without changing production behavior, use one of these:

1. Manually export Sheet tabs to JSON/CSV and convert them into `supabase/.tmp/player-hub-export.json`.
2. Add a future admin-only Apps Script export action that returns raw Sheet rows, then deploy it intentionally.
3. Use Google Sheets API from a local script with a service account, if that becomes preferable.

Do not add a Supabase read path to React during Phase 2.

## Phase 2 Success Criteria

- `npm.cmd run build` passes.
- `npm.cmd run test:e2e` passes against Apps Script.
- Supabase import dry-run completes.
- Real dev import completes only after env is configured.
- Row counts and key status counts match expected exports.
- No app runtime behavior changes.
