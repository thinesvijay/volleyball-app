# Supabase Diagnostic Toggle Runbook

Use this only to test the Apps Script admin-only diagnostic action. This does not switch the production app to Supabase.

## Before You Start

- Keep React unchanged.
- Keep the public API URL unchanged.
- Keep Google Sheets as the default source of truth.
- Do not paste Supabase secrets into React or committed files.
- Do not leave `SUPABASE_PLAYER_HUB_READS_ENABLED=true` after the test.

## 1. Set Apps Script Properties

In Apps Script, open **Project Settings -> Script Properties**.

Set:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PLAYER_HUB_READS_ENABLED=true
```

Save the properties.

## 2. Run The Local Diagnostic

From the project folder:

```powershell
npm.cmd run supabase:test:apps-script-diagnostic
```

Expected result:

```text
Success: true
Supabase reads enabled: true
Counts:
  - appUsers: 4
  - playerProfiles: 3
  - clubTeams: 1
  - teamProfiles: 1
  - teamMembers: 1
  - teamNeeds: 1
  - rosterDrafts: 1
  - rosterPlayers: 1
  - tournaments: 2
```

Counts may change as real data changes. The important checks are:

- `Success: true`
- `Supabase reads enabled: true`
- No service key is printed.
- Counts roughly match the latest `npm.cmd run supabase:snapshot:player-hub` output.

## 3. Turn The Flag Off Immediately

In Apps Script **Project Settings -> Script Properties**, set:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

Save the property.

## 4. Confirm Disabled State

Run:

```powershell
npm.cmd run supabase:test:apps-script-diagnostic
```

Expected result:

```text
Success: true
Supabase reads enabled: false
```

## 5. Run E2E

Run:

```powershell
npm.cmd run test:e2e
```

Expected result:

```text
4 passed
```

## Rollback

If anything looks wrong, set:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

Then run:

```powershell
npm.cmd run test:e2e
```

With the flag false, normal Player Hub behavior remains Apps Script and Google Sheets-backed.
