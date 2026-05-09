# Supabase Apps Script Diagnostic

This diagnostic is the first server-side Supabase read test path for Player Hub. It is disabled by default and does not change the normal app flow.

For the exact temporary enable/test/disable sequence, use [Supabase Diagnostic Toggle Runbook](supabase-diagnostic-toggle-runbook.md).

## Action

```text
testSupabasePlayerHubSnapshot
```

The action is admin-only. It uses the same Apps Script endpoint as the current app, but it does not affect `getPlayerHubSnapshot`.

## Required Script Properties

In Apps Script, open **Project Settings -> Script Properties** and add:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PLAYER_HUB_BACKEND=sheets
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

Default value:

```text
PLAYER_HUB_BACKEND=sheets
SUPABASE_PLAYER_HUB_READS_ENABLED=false
```

For read-only diagnostics, set `SUPABASE_PLAYER_HUB_READS_ENABLED=true` temporarily. For the controlled Player Hub backend beta, use `PLAYER_HUB_BACKEND=supabase` instead.

## Behavior

When disabled, the diagnostic returns a safe response:

```json
{
  "success": true,
  "enabled": false,
  "counts": {},
  "message": "Supabase Player Hub reads are disabled..."
}
```

When enabled, the diagnostic reads counts from Supabase using the service role key stored in Apps Script properties. It returns table-level counts only, not secrets and not full player data.

Counts currently cover:

- `app_users`
- `player_profiles`
- `club_teams`
- `team_profiles`
- `team_members`
- `team_needs`
- `roster_drafts`
- `roster_players`
- `tournaments`

## Manual Test

## Authorize Apps Script External Requests

Keep the read flag off while authorizing:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=false
PLAYER_HUB_BACKEND=sheets
```

After deploying the latest `Code.gs`, authorize UrlFetch once:

1. Open the Apps Script editor.
2. Confirm `SUPABASE_PLAYER_HUB_READS_ENABLED=false` in **Project Settings -> Script Properties**.
3. In the function dropdown, select `authorizeSupabaseUrlFetchOnce`.
4. Click **Run**.
5. Approve the Google permission prompt for external requests.
6. Confirm the execution log says:

```text
UrlFetch authorization check completed
```

This helper does not require app login, does not write data, and does not enable Supabase reads.

Local scripted test, using `supabase/.env.import`:

```powershell
npm.cmd run supabase:test:apps-script-diagnostic
```

The script reads:

```text
APPS_SCRIPT_WEB_APP_URL
APPS_SCRIPT_ADMIN_USERNAME
APPS_SCRIPT_ADMIN_PASSWORD
```

from `supabase/.env.import`. It does not print passwords or Supabase service keys.

Use an admin account only. Prefer POST so credentials are not placed in a browser URL:

```powershell
$body = @{
  action = "testSupabasePlayerHubSnapshot"
  username = "ADMIN_USERNAME"
  password = "ADMIN_PASSWORD"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "YOUR_APPS_SCRIPT_WEB_APP_URL" -ContentType "application/json" -Body $body
```

## Safety

- React is not connected to Supabase.
- The API URL is unchanged.
- Login/auth is unchanged.
- Google Sheets remains the default source of truth.
- `getPlayerHubSnapshot` uses Google Sheets unless `PLAYER_HUB_BACKEND=supabase` or the old read-only diagnostic flag is enabled.
- Do not commit Supabase service keys.
- Do not enable public/anon policies for this diagnostic.

## Rollback

Set:

```text
SUPABASE_PLAYER_HUB_READS_ENABLED=false
PLAYER_HUB_BACKEND=sheets
```

The diagnostic will stop reading Supabase and normal Player Hub behavior remains Google Sheets-backed.
