# Supabase Player Hub Read Beta Session

Use this for one controlled admin/local beta session. The goal is to let Player Hub read from Supabase briefly, verify the dashboard, then immediately roll back to Google Sheets.

## Guardrails

- Do not change React.
- Do not change the API URL.
- Do not put Supabase keys in React.
- Do not replace login/auth.
- Do not change writes.
- Do not automate Apps Script property changes.
- Do not leave `SUPABASE_PLAYER_HUB_READS_ENABLED=true`.
- Rollback must remain simple: set `SUPABASE_PLAYER_HUB_READS_ENABLED=false`.

## Optional Local Checklist

This prints the steps and verifies that local Apps Script env variables are present without printing secrets:

```powershell
npm.cmd run supabase:beta:read-checklist
```

## 1. Confirm Flag Is Off

In Apps Script **Project Settings -> Script Properties**, confirm:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

Run:

```powershell
npm.cmd run supabase:test:apps-script-diagnostic
```

Expected:

```text
Success: true
Supabase reads enabled: false
```

## 2. Enable Supabase Reads Temporarily

In Apps Script **Project Settings -> Script Properties**, set:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=true
```

Save the property.

## 3. Open Local App

Open the local React app.

Login as **Admin**.

Open **Player Hub**.

Check:

- Player dashboard loads.
- Captain/team control loads.
- Admin dashboard tiles load.
- No raw `Failed to fetch`.
- No `Unknown action`.
- No React red overlay.

In Apps Script logs, look for:

```text
[Snapshot] source supabase
```

If Apps Script logs fallback, continue to rollback:

```text
[Snapshot] Supabase read failed; falling back to sheets
```

## 4. Verify Snapshot Shape

Run:

```powershell
npm.cmd run supabase:test:player-hub-snapshot-source
```

Expected:

```text
Success: true
Shape valid: true
Source: supabase
Fallback used: false
```

If source is `sheets` or fallback is true while the flag is enabled, check Apps Script logs and then roll back.

## 5. Run E2E During The Beta Window

Run:

```powershell
npm.cmd run test:e2e
```

Expected:

```text
4 passed
```

## 6. Roll Back Immediately

In Apps Script **Project Settings -> Script Properties**, set:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

Save the property.

## 7. Confirm Disabled

Run:

```powershell
npm.cmd run supabase:test:apps-script-diagnostic
```

Expected:

```text
Success: true
Supabase reads enabled: false
```

## 8. Final Default-Path Check

Run:

```powershell
npm.cmd run test:e2e
```

Expected:

```text
4 passed
```

## Emergency Rollback

Set:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

Only redeploy a previous `Code.gs` version if:

- The flag is false and Player Hub still fails.
- Apps Script logs show an unrelated runtime error.
- E2E fails on the Google Sheets-backed default path.
