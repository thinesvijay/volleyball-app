$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$EnvPath = Join-Path $RepoRoot "supabase\.env.import"

function Read-EnvFile {
  param([string]$Path)

  $values = @{}
  if (!(Test-Path $Path)) {
    return $values
  }

  foreach ($line in Get-Content $Path) {
    $trimmed = $line.Trim()
    if (!$trimmed -or $trimmed.StartsWith("#")) {
      continue
    }

    $parts = $trimmed -split "=", 2
    if ($parts.Count -ne 2) {
      continue
    }

    $key = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")
    $values[$key] = $value
  }

  return $values
}

function Require-Value {
  param(
    [hashtable]$Values,
    [string]$Key,
    [string]$FriendlyName
  )

  $value = ""
  if ($Values.ContainsKey($Key)) {
    $value = [string]$Values[$Key]
  }

  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "$FriendlyName is missing in supabase\.env.import. Run npm.cmd run supabase:setup:import-env first."
  }

  if ($value -like "https://your-project-ref.supabase.co") {
    throw "$FriendlyName still has the template value. Paste the make-teams-pro-dev value first."
  }
}

function Get-JwtPayload {
  param([string]$Token)

  $parts = $Token -split "\."
  if ($parts.Count -lt 2) {
    return $null
  }

  $payload = $parts[1].Replace("-", "+").Replace("_", "/")
  while ($payload.Length % 4 -ne 0) {
    $payload += "="
  }

  try {
    $json = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload))
    return $json | ConvertFrom-Json
  } catch {
    return $null
  }
}

function Require-ServiceRoleKey {
  param([hashtable]$Values)

  $token = [string]$Values["SUPABASE_SERVICE_ROLE_KEY"]
  $payload = Get-JwtPayload $token
  if ($null -eq $payload) {
    Write-Host "Could not inspect SUPABASE_SERVICE_ROLE_KEY locally. Continuing without printing it." -ForegroundColor Yellow
    return
  }

  $role = [string]$payload.role
  if ($role -ne "service_role") {
    throw "SUPABASE_SERVICE_ROLE_KEY does not look like a service_role key. It looks like role '$role'. Use the Supabase service_role key, not the anon/public key."
  }
}

function Run-NpmScript {
  param([string]$ScriptName)

  if ([string]::IsNullOrWhiteSpace($ScriptName)) {
    throw "Internal runner error: missing npm script name."
  }

  Write-Host ""
  Write-Host "> npm.cmd run $ScriptName" -ForegroundColor Cyan
  & npm.cmd "run" $ScriptName
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: npm.cmd run $ScriptName"
  }
}

Write-Host ""
Write-Host "Make Teams Pro Supabase shadow import dry-run" -ForegroundColor Cyan
Write-Host "Safe mode: this forces SUPABASE_IMPORT_DRY_RUN=true for this run." -ForegroundColor DarkGray
Write-Host ""

if (!(Test-Path $EnvPath)) {
  throw "Missing supabase\.env.import. Run npm.cmd run supabase:setup:import-env first."
}

$envValues = Read-EnvFile $EnvPath
Require-Value $envValues "SUPABASE_URL" "SUPABASE_URL"
Require-Value $envValues "SUPABASE_SERVICE_ROLE_KEY" "SUPABASE_SERVICE_ROLE_KEY"
Require-ServiceRoleKey $envValues

if ($envValues.ContainsKey("SUPABASE_IMPORT_DRY_RUN") -and $envValues["SUPABASE_IMPORT_DRY_RUN"].ToLowerInvariant() -eq "false") {
  Write-Host "supabase\.env.import says SUPABASE_IMPORT_DRY_RUN=false, but this dry-run wrapper will override it to true." -ForegroundColor Yellow
}

$previousDryRun = $env:SUPABASE_IMPORT_DRY_RUN
$previousStrictCounts = $env:SUPABASE_VALIDATE_STRICT_COUNTS
$env:SUPABASE_IMPORT_DRY_RUN = "true"
$env:SUPABASE_VALIDATE_STRICT_COUNTS = "false"

Push-Location $RepoRoot
try {
  Run-NpmScript "supabase:export:player-hub"
  Run-NpmScript "supabase:import:player-hub"
  Run-NpmScript "supabase:validate:player-hub"
} finally {
  if ($null -eq $previousDryRun) {
    Remove-Item Env:\SUPABASE_IMPORT_DRY_RUN -ErrorAction SilentlyContinue
  } else {
    $env:SUPABASE_IMPORT_DRY_RUN = $previousDryRun
  }
  if ($null -eq $previousStrictCounts) {
    Remove-Item Env:\SUPABASE_VALIDATE_STRICT_COUNTS -ErrorAction SilentlyContinue
  } else {
    $env:SUPABASE_VALIDATE_STRICT_COUNTS = $previousStrictCounts
  }
  Pop-Location
}

Write-Host ""
Write-Host "Dry-run complete. No Supabase rows were changed by the import step." -ForegroundColor Green
Write-Host "Review the output above and the export file at supabase\.tmp\player-hub-export.json." -ForegroundColor White
Write-Host ""
Write-Host "Only when ready for a real dev import:" -ForegroundColor Cyan
Write-Host "  npm.cmd run supabase:shadow:real-import" -ForegroundColor White
