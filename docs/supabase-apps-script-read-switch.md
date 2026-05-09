# Apps Script Supabase Read Switch

This is the Phase 3 preparation step for Make Teams Pro Player Hub migration. The running app still uses:

```text
React -> Apps Script Code.gs -> Google Sheets
```

Supabase reads are not enabled by default and the React app is not connected to Supabase.

For the temporary diagnostic toggle procedure, use [Supabase Diagnostic Toggle Runbook](supabase-diagnostic-toggle-runbook.md).

## Current State

- Google Sheets remains the default source of truth.
- `getPlayerHubSnapshot` uses Google Sheets when `PLAYER_HUB_BACKEND=sheets` or the property is missing.
- `PLAYER_HUB_BACKEND=supabase` is the main controlled switch for Player Hub Supabase reads through Apps Script.
- The older `SUPABASE_PLAYER_HUB_READS_ENABLED=true` flag still works for read-only diagnostics.
- Apps Script now has a server-side Supabase read path behind the flag:
  - `getSupabaseConfig_()`
  - `isSupabasePlayerHubReadsEnabled_()`
  - `fetchSupabasePlayerHubSnapshot_()`
- If the flag is true, Apps Script attempts to read Player Hub snapshot data from Supabase and maps it into the same response shape used by React.
- If the Supabase read fails, Apps Script logs the failure and falls back to Google Sheets for that request.

## Manual Apps Script Properties

In Apps Script, open **Project Settings -> Script Properties** and add these only when testing a future server-side Supabase read branch:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PLAYER_HUB_BACKEND=sheets
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

Keep `PLAYER_HUB_BACKEND=sheets` unless you are intentionally testing the Apps Script Supabase backend path. Use `PLAYER_HUB_BACKEND=supabase` for the controlled beta switch.

## Safety Rules

- Do not put Supabase service keys in React.
- Do not commit Supabase service keys.
- Do not change the public API URL.
- Do not enable Supabase reads by default.
- Do not create permissive anon policies for this path.
- Keep authenticated E2E passing before and after each migration step.

## Planned Promotion Path

1. Keep Google Sheets as default.
2. Run the admin-only diagnostic with `SUPABASE_PLAYER_HUB_READS_ENABLED=true`.
3. Temporarily test Player Hub snapshot reads in Apps Script dev deployment with the flag true.
4. Watch Apps Script logs for `[Snapshot] source supabase` or fallback logs.
5. Compare Player Hub behavior against the flag-off Google Sheets view.
6. Turn the flag back to false after the test.
7. Keep writes on Google Sheets until a separate write migration is designed.

## Rollback

Set this Apps Script property back to false:

```text
PLAYER_HUB_BACKEND=sheets
```

With the backend mode set to sheets, `getPlayerHubSnapshot` and Player Hub actions use Google Sheets.

See [Player Hub Supabase Backend Switch](supabase-player-hub-backend-switch.md) for the fuller beta checklist.
