# Supabase Player Hub Migration Plan

This document is a planning artifact only. The running Make Teams Pro app still uses React, `Code.gs`, and Google Sheets. Do not change the API URL, login flow, Player Hub UI, or production behavior until a later migration phase explicitly does so.

## Current Player Hub Surface

The current Player Hub is served by `src/modules/playerHub/PlayerHubPage.js` through functions passed from `src/App.js`, which call Apps Script actions in `Code.gs`. Authenticated E2E currently passes against the Apps Script backend.

Active Player Hub features:

- Player profile and club/team selection.
- Account/access requests for Captain, Trainer, Organizer.
- Official clubs/teams master list.
- Team profile and team identity change requests.
- Team membership requests and confirmed team members.
- Internal team needs and published tournament player ads.
- Team need interests and captain review.
- Tournament availability events.
- Event comments, loaded lazily.
- Tournament squad planning.
- Roster draft, submit, admin review, approve/reject, and captain lock.
- Official locked roster display.
- Admin dashboard with lazy-loaded review panels.

## Current Frontend Action Surface

`PlayerHubPage.js` receives its backend actions from `App.js`; those functions call Apps Script actions without exposing Supabase to React. The migration should keep this contract stable until the read/write switch phases.

| Feature | Current frontend actions | Current backend action family |
| --- | --- | --- |
| Initial dashboard snapshot | `loadPlayerHubSnapshot` | `getPlayerHubSnapshot` |
| Profile and club/team choice | `loadMyPlayerProfile`, `saveMyPlayerProfile`, `loadClubTeams` | Player profile and club/team Apps Script actions |
| Account/access | `createAccessRequest`, `loadMyAccessRequests`, `loadAccessRequestsAdmin`, `reviewAccessRequestAdmin` | `AccessRequests` actions |
| Team profile and identity | `loadMyTeamProfile`, `saveMyTeamProfile`, `requestTeamIdentityChange`, `loadTeamIdentityChangeRequests`, `reviewTeamIdentityChangeRequest` | `TeamProfiles`, `TeamChangeRequests` actions |
| Team needs and player ads | `createOrUpdateTeamNeed`, `closeTeamNeed`, `loadVisibleTeamNeeds` | `TeamNeeds` actions |
| Need interest | `createTeamNeedInterest`, `loadMyTeamNeedInterests`, `loadTeamNeedInterestsForCaptain`, `reviewTeamNeedInterest` | `TeamNeedInterests` actions |
| Membership | `createOrUpdateTeamMembershipRequest`, `listMyTeamMembershipRequests`, `listMembershipRequestsForCaptain`, `reviewTeamMembershipRequest`, `addTeamMemberFromInterest`, `removeTeamMember` | `TeamMembershipRequests`, `TeamMembers` actions |
| Tournament availability events | `createTournamentTeamPlan`, `loadMyTournamentTeamPlansForCaptain`, `loadMyTournamentAvailabilityForPlayer`, `updateTournamentAvailabilityResponse`, `loadTournamentAvailabilityForCaptain` | `TournamentTeamPlans`, `TournamentAvailability` actions |
| Squad planning | `loadTournamentSquadPlanningForCaptain`, `assignPlayerToSquad`, `loadMyTournamentSquadPlanningForPlayer` | `TournamentSquadPlanning` actions |
| Roster draft and official roster | `createOrUpdateRosterDraftFromSquadPlanning`, `loadRosterDraftForCaptain`, `submitRosterDraft`, `cancelRosterDraft`, `reviewRosterDraft`, `lockOfficialRoster`, `loadMyRosterStatusForPlayer`, `loadRosterDraftAdmin` | `TournamentRosters`, `TournamentRosterPlayers`, `OfficialRosters` actions |
| Event comments | `loadEventComments`, `addEventComment` | `TeamEventComments` actions |

## Current Sheet Column Inventory

These are the active Player Hub and tournament-planning Sheets observed in `Code.gs`. Import scripts should preserve legacy IDs and normalize usernames/statuses while keeping the Sheet export reversible.

| Google Sheet | Current columns |
| --- | --- |
| `Users` | `Username`, `Password`, `Role`, `SpreadsheetId`, `SkillView`, `SkillScale`, `Active`, `CanUseTeamBuilder`, `CanUseTournaments` |
| `PlayerProfiles` | `ProfileId`, `Username`, `FirstName`, `LastName`, `DisplayName`, `Email`, `Phone`, `Country`, `ClubOrTeam`, `ClubTeamId`, `ClubTeamName`, `TeamNote`, `ProfileType`, `FreeAgent`, `Region`, `PrimaryRole`, `SecondaryRole`, `CustomRole`, `Level`, `Availability`, `LookingForTeam`, `AvailableAsSubstitute`, `CanGuestForTeams`, `InterestedAbroad`, `PublicVisible`, `Approved`, `CreatedAt`, `UpdatedAt` |
| `ClubTeams` | `TeamId`, `Name`, `Country`, `City`, `Active`, `CreatedAt`, `UpdatedAt` |
| `TeamChangeRequests` | `RequestId`, `TeamId`, `CurrentName`, `RequestedName`, `CurrentCountry`, `RequestedCountry`, `CurrentCity`, `RequestedCity`, `RequestedByUsername`, `Reason`, `Status`, `AdminNote`, `CreatedAt`, `ReviewedAt`, `ReviewedBy` |
| `AccessRequests` | `RequestId`, `Username`, `DisplayName`, `Email`, `RequestType`, `ClubTeamId`, `ClubTeamName`, `Message`, `Status`, `AdminNote`, `CreatedAt`, `UpdatedAt`, `ReviewedBy`, `ReviewedAt` |
| `TeamProfiles` | `TeamProfileId`, `ClubTeamId`, `ClubTeamName`, `Country`, `CaptainUsername`, `CaptainDisplayName`, `TeamLevel`, `TeamDescription`, `ContactNote`, `NeedsPlayers`, `NeedsText`, `Active`, `PublicVisible`, `Approved`, `CreatedAt`, `UpdatedAt` |
| `TeamNeeds` | `NeedId`, `TeamProfileId`, `ClubTeamId`, `ClubTeamName`, `CaptainUsername`, `NeedType`, `NeedText`, `NeededCount`, `Status`, `Visibility`, `IsPublished`, `NeedContext`, `TournamentId`, `TournamentName`, `SquadLabel`, `ClassName`, `DeadlineAt`, `SourceType`, `PublishedAt`, `PublicVisible`, `Approved`, `CreatedAt`, `UpdatedAt` |
| `TeamNeedInterests` | `InterestId`, `NeedId`, `TeamProfileId`, `ClubTeamId`, `ClubTeamName`, `PlayerUsername`, `PlayerDisplayName`, `PlayerEmail`, `PlayerPhone`, `PlayerCountry`, `Message`, `Status`, `CreatedAt`, `UpdatedAt`, `ReviewedBy`, `ReviewedAt` |
| `TeamMembers` | `TeamMemberId`, `TeamProfileId`, `ClubTeamId`, `ClubTeamName`, `CaptainUsername`, `PlayerUsername`, `PlayerDisplayName`, `PlayerEmail`, `PlayerPhone`, `PlayerCountry`, `SourceInterestId`, `MemberStatus`, `ConfirmedBy`, `ConfirmedAt`, `CreatedAt`, `UpdatedAt` |
| `TeamMembershipRequests` | `RequestId`, `ClubTeamId`, `ClubTeamName`, `PlayerUsername`, `PlayerDisplayName`, `PlayerEmail`, `PlayerPhone`, `PlayerCountry`, `PlayerProfileId`, `Status`, `RequestedAt`, `ReviewedBy`, `ReviewedAt`, `ReviewNote`, `CreatedAt`, `UpdatedAt` |
| `Tournaments` | `TournamentId`, `Name`, `Country`, `City`, `StartDate`, `EndDate`, `RegistrationDeadline`, `Visibility`, `Status`, `OrganizerUsername`, `CreatedAt`, `PublicCode`, `Published`, `PublishedAt`, `UpdatedAt`, `TournamentJson` |
| `TournamentTeamPlans` | `PlanId`, `TournamentId`, `TournamentName`, `TeamProfileId`, `ClubTeamId`, `ClubTeamName`, `CaptainUsername`, `SquadLabel`, `ClassName`, `PlanStatus`, `DeadlineAt`, `Note`, `CreatedAt`, `UpdatedAt` |
| `TournamentAvailability` | `AvailabilityId`, `PlanId`, `TournamentId`, `TournamentName`, `TeamProfileId`, `ClubTeamId`, `ClubTeamName`, `PlayerUsername`, `PlayerDisplayName`, `PlayerEmail`, `PlayerPhone`, `PlayerCountry`, `ResponseStatus`, `PreferredSquad`, `PlayerNote`, `RequestedBy`, `RequestedAt`, `RespondedAt`, `CreatedAt`, `UpdatedAt` |
| `TournamentSquadPlanning` | `PlanningId`, `PlanId`, `TournamentId`, `TournamentName`, `TeamProfileId`, `ClubTeamId`, `ClubTeamName`, `PlayerUsername`, `PlayerDisplayName`, `PlayerCountry`, `AvailabilityStatus`, `PreferredSquad`, `AssignedSquad`, `PlanningStatus`, `AssignedBy`, `AssignedAt`, `CreatedAt`, `UpdatedAt` |
| `TournamentRosters` | `RosterId`, `PlanId`, `TournamentId`, `TournamentName`, `TeamProfileId`, `ClubTeamId`, `ClubTeamName`, `SquadLabel`, `CaptainUsername`, `RosterStatus`, `SubmittedBy`, `SubmittedAt`, `ReviewedBy`, `ReviewedAt`, `AdminNote`, `LockedAt`, `LockedBy`, `LockReason`, `CreatedAt`, `UpdatedAt` |
| `TournamentRosterPlayers` | `RosterPlayerId`, `RosterId`, `PlanId`, `TournamentId`, `TournamentName`, `TeamProfileId`, `ClubTeamId`, `ClubTeamName`, `SquadLabel`, `PlayerUsername`, `PlayerDisplayName`, `PlayerCountry`, `AssignedSquad`, `RosterRole`, `Source`, `PlayerStatus`, `AddedBy`, `AddedAt`, `CreatedAt`, `UpdatedAt` |
| `OfficialRosters` | `OfficialRosterId`, `DraftId`, `TournamentId`, `TournamentName`, `TeamId`, `TeamName`, `SquadLabel`, `GroupName`, `PlayerUsername`, `PlayerDisplayName`, `PlayerCountry`, `Status`, `LockedAt`, `LockedBy`, `CreatedAt` |
| `TeamEventComments` | `CommentId`, `PlanId`, `TeamProfileId`, `ClubTeamId`, `ClubTeamName`, `Username`, `DisplayName`, `Message`, `CreatedAt`, `UpdatedAt`, `Active` |
| `TournamentAuditLog` | `Timestamp`, `Username`, `Action`, `TournamentId`, `Summary` |

## Current Sheets To Supabase Mapping

| Google Sheet | Key Columns | Proposed Supabase Table | Notes |
| --- | --- | --- | --- |
| `Users` | `Username`, `Password`, `Role`, `SpreadsheetId`, `Active`, `CanUseTeamBuilder`, `CanUseTournaments` | `app_users` | Keep `legacy_username`; do not move auth until a later phase. Password hashes remain legacy-only during shadow phases. |
| `PlayerProfiles` | `ProfileId`, `Username`, names, contact, `ClubTeamId`, options, `PublicVisible`, `Approved` | `player_profiles` | Store `legacy_profile_id`; join to `app_users` by normalized username during import. |
| `ClubTeams` | `TeamId`, `Name`, `Country`, `City`, `Active` | `club_teams` | Preserve `legacy_team_id`; active-name uniqueness mirrors Apps Script duplicate prevention. |
| `TeamChangeRequests` | `RequestId`, current/requested identity fields, requester/reviewer, status | `team_identity_change_requests` | Keeps official club/team identity changes reviewable. |
| `AccessRequests` | `RequestId`, `Username`, `RequestType`, club/team, `Status` | `access_requests` | Approval effects still belong in backend business logic during migration. |
| `TeamProfiles` | `TeamProfileId`, `ClubTeamId`, captain, profile fields, visibility/approval | `team_profiles` | Captain ownership should be policy-checked using approved captain access and team profile ownership. |
| `TeamNeeds` | `NeedId`, team, captain, type, visibility, context, tournament fields, status | `team_needs` | `visibility='published'` and `need_context='tournament'` powers "Player ads"; old needs import as internal unless explicitly published. |
| `TeamNeedInterests` | `InterestId`, `NeedId`, player snapshot, message, status | `team_need_interests` | Keep contact data private to owning captain/admin. |
| `TeamMembers` | `TeamMemberId`, team, captain, player snapshot, source, status | `team_members` | `ACTIVE` members are the source for availability invitations. |
| `TeamMembershipRequests` | `RequestId`, club/team, player snapshot, status, review fields | `team_membership_requests` | Selecting a club/team creates a request, not verified membership. |
| `Tournaments` | `TournamentId`, name/place/date, visibility/status, public fields, `TournamentJson` | `tournaments` | Keep the current tournament engine unchanged until tournament migration is planned. Player Hub only needs event lookup fields. |
| `TournamentTeamPlans` | `PlanId`, tournament, team, captain, plan status, deadline/note | `tournament_events` | This becomes the team-app event card. `PlanId` maps to `legacy_plan_id`. |
| `TournamentAvailability` | `AvailabilityId`, `PlanId`, player snapshot, response/preference/note | `tournament_availability` | Players can only update their own row. |
| `TournamentSquadPlanning` | `PlanningId`, `PlanId`, player, availability, preferred/assigned squad | `tournament_squad_planning` | Planning only; not official history. |
| `TournamentRosters` | `RosterId`, `PlanId`, status, submitted/reviewed/locked fields | `roster_drafts` | Statuses: `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `LOCKED`, `CANCELLED`. |
| `TournamentRosterPlayers` | `RosterPlayerId`, roster/event/team/player snapshots, squad, role, status | `roster_players` | Draft player rows. Do not treat as official history until locked. |
| `OfficialRosters` | `OfficialRosterId`, draft/tournament/team/player snapshots, locked fields | `official_rosters` | Snapshot table; names should remain stable even if team identity changes later. |
| `TeamEventComments` | `CommentId`, `PlanId`, team, username/display name, message, active | `event_comments` | Comments load only when a drawer opens. |
| `TournamentAuditLog` | timestamp, username, action, data | `audit_log` | Future generic audit sink for Player Hub and tournament actions. |

## Proposed Tables

Core identity:

- `app_users`
- `player_profiles`
- `club_teams`
- `team_identity_change_requests`
- `access_requests`

Team model:

- `team_profiles`
- `team_members`
- `team_membership_requests`
- `team_needs`
- `team_need_interests`

Tournament/event planning:

- `tournaments`
- `tournament_events`
- `tournament_availability`
- `tournament_squad_planning`

Roster flow:

- `roster_drafts`
- `roster_players`
- `official_rosters`

Collaboration and audit:

- `event_comments`
- `audit_log`

## Security And RLS Notes

Do not enable production RLS policies until the auth mapping is designed and tested. Conceptually:

- Supabase Auth users should map to `app_users.auth_user_id`.
- Normal players can read and update only their own `player_profiles`, `tournament_availability`, access requests, membership requests, and comments they are allowed to see.
- Active `club_teams` can be read by logged-in users.
- Published tournament player ads can be read by logged-in users. Internal needs remain captain/team/admin only.
- Player phone/email can be read by the player, the owning captain for relevant team needs/membership/event flows, and admin. It should not be exposed in broad marketplace queries.
- Captains can manage team profiles/events/needs only for teams they captain and only after approved Captain access.
- Trainers can access Team Builder permissions, but Trainer access alone should not grant team profile ownership.
- Organizers/admins can review roster drafts according to existing product rules.
- Roster drafts remain editable only while `DRAFT` or `REJECTED`. `LOCKED` rosters should be read-only except for future explicit admin unlock tooling.
- Event comments can be created by invited players, confirmed team members, the owning captain, and admins.
- Admin policies should rely on a server-side role claim or a secure lookup in `app_users`, not client-supplied role fields.

Suggested implementation pattern after auth migration:

1. Keep direct table access disabled for the public anon role.
2. Use RLS for user-owned reads/writes.
3. Use Edge Functions or server-side RPC for complex actions such as roster approval, captain permission checks, and dual-write periods.
4. Keep audit writes server-side so users cannot spoof actor fields.

## Migration Phases

### Phase 1: Schema Only

- Apply `supabase/schema.sql` to a new Supabase project.
- Do not connect React or Apps Script to Supabase.
- Validate table constraints and indexes with local seed data.
- Keep current Apps Script + Google Sheets as the only production system.

### Phase 2: Read-Only Shadow API

- Build a private read-only shadow API that exports current Sheet data and imports it into Supabase on demand or schedule.
- Compare Apps Script `getPlayerHubSnapshot` output with Supabase query output for the same users.
- Do not show Supabase data in the UI yet.
- Measure query speed for player, captain, and admin dashboard snapshots.

### Phase 3: Import Or Dual-Write

- Choose one path:
  - Batch import from Sheets for a cutover rehearsal, or
  - Dual-write selected low-risk entities from Apps Script to Supabase.
- Preserve every Apps Script ID in `legacy_*` columns.
- Start with append-like records such as comments or audit rows before dual-writing roster or membership state.
- Build reconciliation reports for row counts and status counts.

### Phase 4: Switch Player Hub Reads

- Add a feature flag for Player Hub read source.
- Switch only read paths first: profile, clubs, team, events, availability, needs, roster status.
- Keep writes going to Apps Script/Sheets.
- Run authenticated Playwright E2E against both read modes before any production switch.

### Phase 5: Switch Player Hub Writes

- Move write actions one feature at a time:
  - comments,
  - profile updates,
  - access requests,
  - team needs/interests,
  - availability responses,
  - squad planning,
  - roster draft/review/lock.
- Keep Apps Script fallback during early rollout.
- Use server-side functions for actions that change permissions or roster status.

### Phase 6: Retire Apps Script Player Hub Actions

- Stop calling Player Hub Apps Script actions only after Supabase reads/writes pass E2E and reconciliation for a full beta window.
- Keep Team Builder and tournament scoring on Apps Script until their own migrations are planned.
- Archive Sheet exports and keep legacy IDs permanently for support/debugging.

## Import Notes

- Normalize usernames to lowercase for joins, but keep original `legacy_username`.
- Parse booleans from Apps Script variants: `true`, `TRUE`, `1`, `yes`, `on`.
- Existing old `TeamNeeds` rows should default to `visibility='internal'` and `need_context='general'` unless published tournament fields are clearly present.
- `OfficialRosters` should be treated as immutable snapshots. Do not backfill changed team names into locked history.
- Import comments as active unless `Active` is false-like.
- Convert empty string timestamps to `null`; store ISO strings as `timestamptz`.

## What This Plan Does Not Do

- It does not change the running React app.
- It does not replace login/auth.
- It does not add Supabase client code.
- It does not remove Apps Script or Google Sheets.
- It does not migrate Team Builder, scoring, public live view, or tournament setup.
