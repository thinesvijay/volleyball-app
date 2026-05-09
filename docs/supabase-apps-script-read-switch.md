# Apps Script Supabase Read Switch

This is the Phase 3 preparation step for Make Teams Pro Player Hub migration. The running app still uses:

```text
React -> Apps Script Code.gs -> Google Sheets
```

Supabase reads are not enabled by default and the React app is not connected to Supabase.

For the current diagnostic-only toggle procedure, use [Supabase Diagnostic Toggle Runbook](supabase-diagnostic-toggle-runbook.md).

## Current State

- Google Sheets remains the source of truth.
- `getPlayerHubSnapshot` still returns the existing Google Sheets snapshot.
- Apps Script now has dormant helper stubs for a future server-side Supabase read path:
  - `getSupabaseConfig_()`
  - `isSupabasePlayerHubReadsEnabled_()`
  - `fetchSupabasePlayerHubSnapshot_()`
- The helper path is disabled unless Apps Script properties explicitly enable it.
- The current stub logs and falls back to Google Sheets if someone enables the flag before the real read implementation is promoted.

## Manual Apps Script Properties

In Apps Script, open **Project Settings -> Script Properties** and add these only when testing a future server-side Supabase read branch:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

Keep `SUPABASE_PLAYER_HUB_READS_ENABLED=false` until a later step implements and verifies the server-side Supabase snapshot read.

## Safety Rules

- Do not put Supabase service keys in React.
- Do not commit Supabase service keys.
- Do not change the public API URL.
- Do not enable Supabase reads by default.
- Do not create permissive anon policies for this path.
- Keep authenticated E2E passing before and after each migration step.

## Planned Promotion Path

1. Keep Google Sheets as default.
2. Implement `fetchSupabasePlayerHubSnapshot_()` behind the server-side flag.
3. Test in Apps Script dev deployment with `SUPABASE_PLAYER_HUB_READS_ENABLED=true`.
4. Compare Supabase snapshot output to the Google Sheets snapshot for the same users.
5. Only after parity is proven, consider enabling Supabase reads for a limited dev account.
6. Keep writes on Google Sheets until a separate write migration is designed.

## Rollback

Set this Apps Script property back to false:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

With the flag false, `getPlayerHubSnapshot` uses Google Sheets.
