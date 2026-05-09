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

function Run-Step {
  param([string[]]$Args)

  Write-Host ""
  Write-Host "> npm.cmd $($Args -join ' ')" -ForegroundColor Cyan
  & npm.cmd @Args
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: npm.cmd $($Args -join ' ')"
  }
}

Write-Host ""
Write-Host "Make Teams Pro REAL Supabase dev shadow import" -ForegroundColor Yellow
Write-Host "This writes rows to the Supabase dev project only." -ForegroundColor Yellow
Write-Host "It does NOT connect React to Supabase or change production app behavior." -ForegroundColor DarkGray
Write-Host ""

if (!(Test-Path $EnvPath)) {
  throw "Missing supabase\.env.import. Run npm.cmd run supabase:setup:import-env first."
}

$envValues = Read-EnvFile $EnvPath
Require-Value $envValues "SUPABASE_URL" "SUPABASE_URL"
Require-Value $envValues "SUPABASE_SERVICE_ROLE_KEY" "SUPABASE_SERVICE_ROLE_KEY"

Write-Host "Before continuing, confirm you already ran:" -ForegroundColor White
Write-Host "  npm.cmd run supabase:shadow:dry-run" -ForegroundColor White
Write-Host ""
Write-Host "Type IMPORT_TO_SUPABASE_DEV to write the shadow import to Supabase dev." -ForegroundColor Yellow
$confirmation = Read-Host "Confirmation"
if ($confirmation -ne "IMPORT_TO_SUPABASE_DEV") {
  Write-Host "Cancelled. No import was run." -ForegroundColor Green
  exit 0
}

$previousDryRun = $env:SUPABASE_IMPORT_DRY_RUN
$env:SUPABASE_IMPORT_DRY_RUN = "false"

Push-Location $RepoRoot
try {
  Run-Step @("run", "supabase:export:player-hub")
  Run-Step @("run", "supabase:import:player-hub")
  Run-Step @("run", "supabase:validate:player-hub")
} finally {
  if ($null -eq $previousDryRun) {
    Remove-Item Env:\SUPABASE_IMPORT_DRY_RUN -ErrorAction SilentlyContinue
  } else {
    $env:SUPABASE_IMPORT_DRY_RUN = $previousDryRun
  }
  Pop-Location
}

Write-Host ""
Write-Host "Real dev shadow import complete." -ForegroundColor Green
Write-Host "The production React app still uses Apps Script and Google Sheets." -ForegroundColor White
Write-Host "Next: compare row counts in Supabase with supabase\import-checklist.sql." -ForegroundColor Cyan
