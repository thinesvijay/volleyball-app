# Supabase Player Hub Read Beta Test

Use this for one short local/admin test session only. This tests Apps Script reading Player Hub snapshot data from Supabase while keeping Google Sheets as the default source of truth.

## Safety Rules

- Do not change React.
- Do not change the API URL.
- Do not put Supabase keys in React.
- Do not change login/auth.
- Do not change writes.
- Do not leave `SUPABASE_PLAYER_HUB_READS_ENABLED=true` after the test.
- Google Sheets remains the default path when the flag is false.

## Before The Test

Confirm:

- Latest `Code.gs` is copied into Apps Script.
- Latest Apps Script web app version is deployed.
- Apps Script Script Properties include:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

Confirm the disabled state:

```powershell
npm.cmd run supabase:test:apps-script-diagnostic
```

Expected:

```text
Success: true
Supabase reads enabled: false
```

## Enable For One Test Session

In Apps Script **Project Settings -> Script Properties**, set:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=true
```

Save the property.

## Manual Local Browser Check

1. Open the local React app.
2. Login as admin.
3. Open Player Hub.
4. Check the normal player dashboard content.
5. Check captain/team control content.
6. Check admin dashboard content.
7. Confirm there are no raw errors such as:
   - `Failed to fetch`
   - `Unknown action`
   - `Compiled with problems`
   - `Uncaught runtime errors`

In Apps Script executions/logs, confirm:

```text
[Snapshot] source supabase
```

If you see a fallback log, Supabase read failed and Apps Script used Google Sheets:

```text
[Snapshot] Supabase read failed; falling back to sheets
```

## Run E2E During The Temporary Flag Window

Run:

```powershell
npm.cmd run test:e2e
```

Expected:

```text
4 passed
```

## Turn Supabase Reads Off Immediately

In Apps Script **Project Settings -> Script Properties**, set:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

Save the property.

Confirm disabled:

```powershell
npm.cmd run supabase:test:apps-script-diagnostic
```

Expected:

```text
Success: true
Supabase reads enabled: false
```

Run the default-path E2E check:

```powershell
npm.cmd run test:e2e
```

Expected:

```text
4 passed
```

## Rollback

First rollback step:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

That restores the Google Sheets-backed Player Hub path.

Only redeploy a previous `Code.gs` version if:

- The flag is false and Player Hub still fails.
- Apps Script logs show an unrelated runtime error.
- E2E fails on the default Google Sheets path.

After rollback, run:

```powershell
npm.cmd run test:e2e
```
