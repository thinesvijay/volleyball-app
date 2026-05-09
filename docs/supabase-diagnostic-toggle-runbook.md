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

## 2. Authorize UrlFetch If Needed

If the diagnostic says Apps Script does not have permission to call `UrlFetchApp.fetch`, keep the flag off while authorizing:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

Then:

1. Deploy the latest `Code.gs`.
2. Open the Apps Script editor.
3. Select `authorizeSupabaseUrlFetchOnce`.
4. Click **Run**.
5. Approve the Google external request permission.
6. Confirm the log says `UrlFetch authorization check completed`.
7. Set `SUPABASE_PLAYER_HUB_READS_ENABLED=true` again only for the diagnostic test.

## 3. Run The Local Diagnostic

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

## 4. Turn The Flag Off Immediately

In Apps Script **Project Settings -> Script Properties**, set:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

Save the property.

## 5. Confirm Disabled State

Run:

```powershell
npm.cmd run supabase:test:apps-script-diagnostic
```

Expected result:

```text
Success: true
Supabase reads enabled: false
```

## 6. Run E2E

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
